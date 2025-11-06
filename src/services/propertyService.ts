import { supabase } from '../lib/supabase';
import { Property } from '../App';

export interface PropertyDB {
  id: string;
  user_id?: string;
  name: string;
  location: string;
  price_from: number;
  area_from: number;
  image: string | null;
  description: string | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  project_id: string | null;
  status: 'available' | 'sold' | 'reserved';
  created_at?: string;
  updated_at?: string;
}

export const propertyService = {
  /**
   * Obtener todas las propiedades (del usuario actual)
   * Los admins verán todas las propiedades gracias a RLS
   */
  async getAll(): Promise<Property[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // RLS maneja automáticamente el acceso: usuarios ven solo las suyas, admins ven todas
    // Nota: Las propiedades son visibles para todos según RLS, pero aquí filtramos las del usuario
    // Los admins pueden ver todas sin filtrar
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(convertFromDB);
  },

  /**
   * Obtener propiedades disponibles (todas las propiedades disponibles para todos los usuarios)
   */
  async getAvailable(): Promise<Property[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Las propiedades son visibles para todos según RLS, pero filtramos por status
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(convertFromDB);
  },

  /**
   * Obtener una propiedad por ID
   */
  async getById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data ? convertFromDB(data) : null;
  },

  /**
   * Crear una nueva propiedad
   */
  async create(property: Omit<Property, 'id'>): Promise<Property> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = convertToDB(property);
    dbData.user_id = user.id;

    const { data, error } = await supabase
      .from('properties')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;

    return convertFromDB(data);
  },

  /**
   * Actualizar una propiedad
   */
  async update(id: string, property: Partial<Omit<Property, 'id'>>): Promise<Property> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('properties')
      .update(convertToDB(property as Property))
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return convertFromDB(data);
  },

  /**
   * Eliminar una propiedad
   */
  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }
};

function convertFromDB(db: PropertyDB): Property {
  return {
    id: db.id,
    name: db.name,
    location: db.location,
    priceFrom: Number(db.price_from),
    areaFrom: Number(db.area_from),
    image: db.image || '',
    description: db.description || '',
    bedrooms: db.bedrooms,
    bathrooms: db.bathrooms,
    area: Number(db.area),
    price: Number(db.price),
    projectId: db.project_id || ''
  };
}

function convertToDB(property: Partial<Property>): Partial<PropertyDB> {
  const db: any = {};

  if (property.name !== undefined) db.name = property.name;
  if (property.location !== undefined) db.location = property.location;
  if (property.priceFrom !== undefined) db.price_from = property.priceFrom;
  if (property.areaFrom !== undefined) db.area_from = property.areaFrom;
  if (property.image !== undefined) db.image = property.image || null;
  if (property.description !== undefined) db.description = property.description || null;
  if (property.bedrooms !== undefined) db.bedrooms = property.bedrooms;
  if (property.bathrooms !== undefined) db.bathrooms = property.bathrooms;
  if (property.area !== undefined) db.area = property.area;
  if (property.price !== undefined) db.price = property.price;
  if (property.projectId !== undefined) db.project_id = property.projectId || null;

  return db;
}

