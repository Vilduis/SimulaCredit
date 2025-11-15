import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserDB {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  role?: 'user' | 'admin';
}

/**
 * Obtener perfil del usuario actual desde la tabla users
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // Si no existe el perfil, crearlo automáticamente
    if (error.code === 'PGRST116') {
      const newProfile = await createUserProfile(user.id, user.email || '', user.user_metadata?.full_name);
      return newProfile;
    }
    throw error;
  }

  return data as User;
}

/**
 * Verificar si el usuario actual es admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === 'admin';
}

/**
 * Crear perfil de usuario en la tabla users
 */
async function createUserProfile(userId: string, email: string, fullName?: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      role: 'user' // Por defecto es user, solo admins pueden crear otros admins
    })
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export const userService = {
  /**
   * Obtener todos los usuarios (solo admins)
   */
  async getAll(): Promise<User[]> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('No tienes permisos para ver todos los usuarios');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
  },

  /**
   * Obtener un usuario por ID (solo admins)
   */
  async getById(id: string): Promise<User> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('No tienes permisos para ver este usuario');
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  },

  /**
   * Crear un nuevo usuario/empleado (solo admins)
   * Esto crea el usuario en Supabase Auth y luego el perfil en la tabla users
   */
  async create(userData: CreateUserData): Promise<User> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('Solo los administradores pueden crear usuarios');
    }

    // Crear usuario en Supabase Auth usando Admin API
    // Nota: Esto requiere usar la Service Role Key, pero desde el cliente
    // usamos el método signUp que crea el usuario pero requiere confirmación
    // Para producción, esto debería hacerse desde un backend con Service Role Key
    
    // Por ahora, creamos el usuario con signUp y luego actualizamos el perfil
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al crear usuario');

    // Crear/actualizar perfil en la tabla users de forma idempotente
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name || null,
        role: userData.role || 'user'
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      // Si falla crear el perfil, intentar eliminar el usuario de auth
      // (aunque esto requeriría Service Role Key)
      throw profileError;
    }

    return profileData as User;
  },

  /**
   * Actualizar un usuario (solo admins o el propio usuario)
   */
  async update(id: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const isUserAdmin = await isAdmin();
    const isOwnProfile = user.id === id;

    if (!isUserAdmin && !isOwnProfile) {
      throw new Error('No tienes permisos para actualizar este usuario');
    }

    // Si no es admin, no puede cambiar el rol
    if (!isUserAdmin && updates.role) {
      throw new Error('No tienes permisos para cambiar el rol');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  /**
   * Eliminar un usuario (solo admins)
   */
  async delete(id: string): Promise<void> {
    const isUserAdmin = await isAdmin();
    if (!isUserAdmin) {
      throw new Error('Solo los administradores pueden eliminar usuarios');
    }

    // No permitir eliminar a sí mismo
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id === id) {
      throw new Error('No puedes eliminarte a ti mismo');
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Nota: El usuario en auth.users se eliminará automáticamente por CASCADE
  },

  /**
   * Obtener perfil del usuario actual
   */
  getCurrentUserProfile,

  /**
   * Verificar si el usuario actual es admin
   */
  isAdmin
};

