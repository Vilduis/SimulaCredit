/**
 * Script para migrar las propiedades mock existentes a Supabase
 * Ejecutar una vez después de crear las tablas
 */

import { propertyService } from '../services/propertyService';
import { Property } from '../App';

const mockProperties: Omit<Property, 'id'>[] = [
    {
        name: 'Torres del Mar',
        location: 'Miraflores, Lima',
        priceFrom: 320000,
        areaFrom: 85,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Exclusivos departamentos con vista al mar',
        bedrooms: 3,
        bathrooms: 2,
        area: 85,
        price: 320000,
        projectId: 'proj-1'
    },
    {
        name: 'Residencial Vista Verde',
        location: 'San Borja, Lima',
        priceFrom: 280000,
        areaFrom: 70,
        image: 'https://images.unsplash.com/photo-1758193431393-0aead94a6a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kbyUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc1OTQzNjA1MHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Moderno complejo residencial con áreas verdes',
        bedrooms: 2,
        bathrooms: 2,
        area: 70,
        price: 280000,
        projectId: 'proj-2'
    },
    {
        name: 'Conjunto Habitacional Los Pinos',
        location: 'Surco, Lima',
        priceFrom: 250000,
        areaFrom: 90,
        image: 'https://images.unsplash.com/photo-1504202302068-15fc2055f7f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvdXNpbmclMjBwcm9qZWN0fGVufDF8fHx8MTc1OTQzNjA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Casas familiares en zona residencial',
        bedrooms: 3,
        bathrooms: 3,
        area: 90,
        price: 250000,
        projectId: 'proj-3'
    },
    {
        name: 'Edificio Central Plaza',
        location: 'San Isidro, Lima',
        priceFrom: 450000,
        areaFrom: 120,
        image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZ3xlbnwxfHx8fDE3NTkzNzExMTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Departamentos de lujo en el corazón financiero',
        bedrooms: 4,
        bathrooms: 3,
        area: 120,
        price: 450000,
        projectId: 'proj-4'
    },
    {
        name: 'Condominio Los Jardines',
        location: 'La Molina, Lima',
        priceFrom: 195000,
        areaFrom: 65,
        image: 'https://images.unsplash.com/photo-1758193431393-0aead94a6a1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjb25kbyUyMGRldmVsb3BtZW50fGVufDF8fHx8MTc1OTQzNjA1MHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Departamentos accesibles para jóvenes familias',
        bedrooms: 2,
        bathrooms: 1,
        area: 65,
        price: 195000,
        projectId: 'proj-5'
    },
    {
        name: 'Residencial El Olivar',
        location: 'San Isidro, Lima',
        priceFrom: 380000,
        areaFrom: 95,
        image: 'https://images.unsplash.com/photo-1504202302068-15fc2055f7f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNpZGVudGlhbCUyMGhvdXNpbmclMjBwcm9qZWN0fGVufDF8fHx8MTc1OTQzNjA1M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Elegantes residencias cerca al Parque El Olivar',
        bedrooms: 3,
        bathrooms: 2,
        area: 95,
        price: 380000,
        projectId: 'proj-6'
    }
];

/**
 * Migrar propiedades mock a Supabase
 * Solo migra si no existen propiedades en la BD
 */
export async function migrateProperties(): Promise<void> {
    try {
        // Verificar si ya hay propiedades
        const existing = await propertyService.getAll();

        if (existing.length > 0) {
            console.log(`Ya existen ${existing.length} propiedades en la BD. No se migrarán las propiedades mock.`);
            return;
        }

        // Migrar todas las propiedades
        console.log('Migrando propiedades mock a Supabase...');
        for (const property of mockProperties) {
            await propertyService.create(property);
            console.log(`✓ Migrada: ${property.name}`);
        }

        console.log('✅ Migración completada exitosamente');
    } catch (error) {
        console.error('❌ Error al migrar propiedades:', error);
        throw error;
    }
}

