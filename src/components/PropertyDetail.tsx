import { Navigation } from './Navigation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Screen, Property } from '../App';
import { MapPin, Home, Car, Dumbbell, Shield, Calculator, ArrowLeft } from 'lucide-react';
// Reemplazado ImageWithFallback por <img> tras eliminar carpeta figma

interface PropertyDetailProps {
  property: Property;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onSimulateForProperty: (property: Property) => void;
}

export function PropertyDetail({ property, onNavigate, onLogout, onSimulateForProperty }: PropertyDetailProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Mock additional images
  const galleryImages = [
    property.image,
    'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTkzMzA0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    property.image,
    'https://images.unsplash.com/photo-1594873604892-b599f847e859?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTkzMzA0NTh8MA&ixlib=rb-4.1.0&q=80&w=1080'
  ];

  const amenities = [
    { icon: Car, label: 'Estacionamiento' },
    { icon: Dumbbell, label: 'Gimnasio' },
    { icon: Shield, label: 'Seguridad 24/7' },
    { icon: Home, label: 'Área común' }
  ];

  const specifications = [
    { label: 'Dormitorios', value: property.bedrooms.toString() },
    { label: 'Baños', value: property.bathrooms.toString() },
    { label: 'Área total', value: `${property.area} m²` },
    { label: 'Entrega', value: 'Inmediata' },
    { label: 'Piso', value: '5° piso' },
    { label: 'Orientación', value: 'Norte' }
  ];

  return (
    <div>
      <Navigation currentScreen="projects" onNavigate={onNavigate} onLogout={onLogout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('projects')}
            className="flex items-center space-x-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al catálogo</span>
          </Button>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <h1 className="text-3xl text-gray-900 mb-2">{property.name}</h1>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{property.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl text-gray-900 mb-2">{formatCurrency(property.price)}</div>
              <Badge className="bg-green-500 hover:bg-green-600">Disponible</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galería de fotos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Galería de Fotos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {galleryImages.map((image, index) => (
                    <div 
                      key={index} 
                      className={`relative overflow-hidden rounded-lg ${index === 0 ? 'col-span-2 h-64' : 'h-32'}`}
                    >
                      <img
                        src={image}
                        alt={`${property.name} - Imagen ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Plano del departamento */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Plano del Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Home className="w-12 h-12 mx-auto mb-2" />
                    <p>Plano arquitectónico</p>
                    <p className="text-sm">Área: {property.area} m²</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Información lateral */}
          <div className="space-y-6">
            {/* Características principales */}
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">{spec.label}:</span>
                      <span className="text-gray-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.map((amenity, index) => {
                    const Icon = amenity.icon;
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{amenity.label}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Descripción */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {property.description}. Esta unidad cuenta con acabados de primera calidad, 
                  amplios espacios y excelente iluminación natural. Ubicado en una zona 
                  privilegiada con fácil acceso a transporte público y centros comerciales.
                </p>
              </CardContent>
            </Card>

            {/* Botón de simulación */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={() => onSimulateForProperty(property)}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center space-x-2"
                  size="lg"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Simular Crédito para esta Unidad</span>
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Calcula tu plan de pagos personalizado
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}