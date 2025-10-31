// components/WorkersList.tsx - Updated
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Star, Briefcase, Calendar, MessageCircle } from 'lucide-react';
import { nigeriaStates } from '../lib/states';
import { toast } from 'sonner';

// Available categories from API
const CATEGORIES = [
  'ALL',
  'Painter',
  'Plumber',
  'Electrician',
  'Carpenter',
  'Mason',
  'Tiler',
  'Roofer',
  'Welder',
  'SteelBender',
  'ConcreteWorker',
  'Bricklayer',
  'FlooringSpecialist',
  'Glazier',
  'InteriorDecorator',
  'FurnitureMaker',
  'Upholsterer',
  'CurtainBlindInstaller',
  'WallpaperSpecialist',
  'Landscaper',
  'Gardener',
  'FenceInstaller',
  'SwimmingPoolTechnician',
  'OutdoorLightingSpecialist',
  'RealEstateAgent',
  'PropertyManager',
  'FacilityManager',
  'BuildingInspector',
  'QuantitySurveyor',
  'Architect',
  'CivilEngineer',
  'StructuralEngineer',
  'Cleaner',
  'Handyman',
  'HVACTechnician',
  'ElevatorTechnician',
  'SecuritySystemInstaller',
  'PestControlSpecialist',
  'DemolitionExpert',
  'SiteSupervisor',
  'ConstructionLaborer',
  'SafetyOfficer',
  'FireSafetyOfficer',
  'Other'
] as const;

interface Worker {
  profile: {
    id: string;
    user_id: string;
    category: string;
    experience_years: number;
    description: string;
    hourly_rate: number;
    daily_rate: number;
    location_state: string;
    location_city: string;
    is_available: boolean;
  };
  portfolio: any[];
  reviews: any[];
  user?: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
  };
}

export const WorkersList = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedState, setSelectedState] = useState(nigeriaStates[0]?.state || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchWorkers();
    }
  }, [selectedCategory, selectedState, token]);

  const handleViewProfile = (workerUserId: string) => {
  console.log('👤 Viewing profile for worker user ID:', workerUserId);
    navigate(`/dashboard/workers/${workerUserId}`);
  };

  // In WorkersList.tsx - UPDATE the handleStartChat function
  const handleStartChat = async (workerUserId: string) => {
    if (!user || user.role !== 'employer') {
      alert('Only employers can start chats with workers');
      return;
    }
  
    console.log('💬 [WorkersList] Starting chat with worker user ID:', workerUserId);
  
    try {
      // First create the chat, then navigate
      const response = await fetch('https://verinest.up.railway.app/api/chat/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          other_user_id: workerUserId 
        }),
      });
  
      let chatId = null;

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [WorkersList] Chat created successfully:', data);
        
        // Navigate to chat with the created chat ID
        chatId = data.data?.chat?.id || data.data?.id;
      } else if (response.status === 422) {
        // Chat already exists - fetch existing chats and find the right one
        console.log('🔄 [WorkersList] Chat already exists, fetching existing chats...');
        const chatsResponse = await fetch('https://verinest.up.railway.app/api/chat/chats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json();
          const existingChat = chatsData.data?.find((chat: any) => 
            chat.other_user?.id === workerUserId
          );
          
          if (existingChat) {
            chatId = existingChat.id;
            console.log('✅ [WorkersList] Found existing chat:', existingChat);
          }
        }
      } else {
        const errorData = await response.json();
        console.error('❌ [WorkersList] Failed to create chat:', errorData);
        toast.error(errorData.message || 'Failed to start chat');
        return;
      }

      if (chatId) {
        navigate('/dashboard/chat', { 
          state: { 
            autoSelectChatId: chatId
          } 
        });
        toast.success('Chat started successfully!');
      } else {
        console.error('❌ [WorkersList] No chat ID found');
        toast.error('Failed to create chat: No chat data');
      }
    } catch (error) {
      console.error('❌ [WorkersList] Network error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    }
  };


  const fetchWorkers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Only include state in initial params if it's selected
      const params = new URLSearchParams({
        limit: '20',
        page: '1',
      });

      // Add state filter if selected
      if (selectedState) {
        params.append('location_state', selectedState);
      }

      // Add category filter only if not ALL
      if (selectedCategory !== 'ALL') {
        params.append('category', selectedCategory);
      }

      console.log('🔍 Fetching workers with params:', params.toString());

      const response = await fetch(`https://verinest.up.railway.app/api/labour/workers/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      console.log('🔍 Response status:', response.status);
      const responseText = await response.text();
      console.log('🔍 Response text:', responseText);

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          console.log('🔍 Parsed data:', data);
          setWorkers(data.data || []);
        } catch (parseError) {
          console.error('Failed to parse response:', parseError);
          setError('Invalid response format from server');
        }
      } else {
        console.error('Failed to fetch workers:', response.status, responseText);
        setError(`Failed to fetch workers: ${response.status}`);
      }
    } catch (error) {
      console.error('Network error while fetching workers:', error);
      setError('Network error while fetching workers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Available Workers</h1>
        <p className="text-muted-foreground">Find skilled workers for your projects</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="w-full md:w-64">
          <select
            className="w-full p-2 border rounded-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category === 'ALL' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-64">
          <select
            className="w-full p-2 border rounded-lg"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {nigeriaStates.map((item) => (
              <option key={item.state} value={item.state}>{item.state}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="text-center py-4 text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <Card key={worker.profile.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="capitalize">
                    {worker.profile.category}
                  </CardTitle>
                  <CardDescription>
                    {worker.profile.experience_years} years experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2" />
                    {worker.profile.location_city}, {worker.profile.location_state}
                  </div>
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-2" />
                    ₦{worker.profile.hourly_rate?.toLocaleString()}/hour
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    ₦{worker.profile.daily_rate?.toLocaleString()}/day
                  </div>
                  {worker.reviews.length > 0 && (
                    <div className="flex items-center text-sm">
                      <Star className="h-4 w-4 mr-2 text-yellow-500" />
                      {worker.reviews.length} reviews
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewProfile(worker.profile.user_id)}
                    >
                      View Profile
                    </Button>
                    {user?.role === 'employer' && (
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => handleStartChat(worker.profile.user_id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workers.length === 0 && !error && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No workers found in {selectedState} for the selected category.
                  Try adjusting your filters.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};