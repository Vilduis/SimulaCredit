import { supabase } from '../lib/supabase';
import { Client } from '../App';

export interface ClientDB {
  id: string;
  user_id?: string;
  name: string;
  dni: string;
  phone: string;
  email: string;
  monthly_income: number;
  occupation: string;
  marital_status: string;
  address: string;
  department: string;
  province: string;
  district: string;
  created_at?: string;
  updated_at?: string;
}

export const clientService = {
  /**
   * Obtener todos los clientes del usuario actual
   * Los admins verán todos los clientes gracias a RLS
   */
  async getAll(): Promise<Client[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // RLS maneja automáticamente el acceso: usuarios ven solo los suyos, admins ven todos
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(convertFromDB);
  },

  /**
   * Obtener un cliente por ID
   */
  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      throw error;
    }

    return data ? convertFromDB(data) : null;
  },

  /**
   * Obtener un cliente por DNI (del usuario actual)
   * Los admins pueden buscar cualquier DNI
   * @param dni - Número de DNI a buscar
   * @param excludeId - ID del cliente a excluir (útil para validaciones al editar)
   */
  async getByDni(dni: string, excludeId?: string): Promise<Client | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // RLS maneja automáticamente el acceso
    let query = supabase
      .from('clients')
      .select('*')
      .eq('dni', dni);
    
    // Excluir el ID actual si se está editando
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? convertFromDB(data) : null;
  },

  /**
   * Crear un nuevo cliente
   */
  async create(client: Omit<Client, 'id'>): Promise<Client> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = convertToDB(client);
    dbData.user_id = user.id;

    const { data, error } = await supabase
      .from('clients')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return convertFromDB(data);
  },

  /**
   * Actualizar un cliente
   */
  async update(id: string, client: Partial<Omit<Client, 'id'>>): Promise<Client> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clients')
      .update(convertToDB(client as Client))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return convertFromDB(data);
  },

  /**
   * Eliminar un cliente
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }
};

function convertFromDB(db: ClientDB): Client {
  return {
    id: db.id,
    name: db.name,
    dni: db.dni,
    phone: db.phone,
    email: db.email,
    monthlyIncome: Number(db.monthly_income),
    occupation: db.occupation,
    maritalStatus: db.marital_status,
    address: db.address,
    department: db.department,
    province: db.province,
    district: db.district
  };
}

function convertToDB(client: Partial<Client>): Partial<ClientDB> {
  const db: any = {};

  if (client.name !== undefined) db.name = client.name;
  if (client.dni !== undefined) db.dni = client.dni;
  if (client.phone !== undefined) db.phone = client.phone;
  if (client.email !== undefined) db.email = client.email;
  if (client.monthlyIncome !== undefined) db.monthly_income = client.monthlyIncome;
  if (client.occupation !== undefined) db.occupation = client.occupation;
  if (client.maritalStatus !== undefined) db.marital_status = client.maritalStatus;
  if (client.address !== undefined) db.address = client.address;
  if (client.department !== undefined) db.department = client.department;
  if (client.province !== undefined) db.province = client.province;
  if (client.district !== undefined) db.district = client.district;

  return db;
}

