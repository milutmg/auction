
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GlassmorphicCard } from '@/components/ui/GlassmorphicCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { apiService } from '@/services/api';

interface AuctionFormData {
  title: string;
  description: string;
  image: File | null;
  thumbnail: File | null;
  starting_bid: string;
  reserve_price: string;
  estimated_value_min: string;
  estimated_value_max: string;
  category_id: string;
  end_time: string;
}

const CreateAuction = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const form = useForm<AuctionFormData>({
    defaultValues: {
      title: '',
      description: '',
      image: null,
      thumbnail: null,
      starting_bid: '',
      reserve_price: '',
      estimated_value_min: '',
      estimated_value_max: '',
      category_id: '',
      end_time: '',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await apiService.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories. Please refresh the page.",
          variant: "destructive",
        });
        
        // Fallback to mock categories if API fails
        const mockCategories = [
          { id: '1', name: 'Furniture', description: 'Antique furniture pieces' },
          { id: '2', name: 'Jewelry', description: 'Vintage and antique jewelry' },
          { id: '3', name: 'Art', description: 'Fine art and paintings' },
          { id: '4', name: 'Collectibles', description: 'Rare collectible items' }
        ];
        setCategories(mockCategories);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (data: AuctionFormData) => {
    if (!user) return;

    setFormError('');
    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('starting_bid', data.starting_bid);
      formData.append('category_id', data.category_id);
      formData.append('end_time', data.end_time);
      
      if (data.reserve_price && data.reserve_price !== '') {
        formData.append('reserve_price', data.reserve_price);
      }
      if (data.estimated_value_min && data.estimated_value_min !== '') {
        formData.append('estimated_value_min', data.estimated_value_min);
      }
      if (data.estimated_value_max && data.estimated_value_max !== '') {
        formData.append('estimated_value_max', data.estimated_value_max);
      }
      if (data.image) {
        formData.append('image', data.image);
      }
      if (data.thumbnail) {
        formData.append('thumbnail', data.thumbnail);
      }

      // Send FormData directly to API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Server error occurred' }));
        throw new Error(error.error || `Server error: ${response.status}`);
      }

      const createdAuction = await response.json();
      
      console.log('Auction created successfully:', createdAuction);

      // Success - no toast needed, just navigate
      
      navigate('/auctions');
    } catch (error) {
      console.error('Error creating auction:', error);
      let errorMessage = "Failed to create auction. Please try again.";
      
      if (error.message.includes('Invalid file type')) {
        errorMessage = "Please upload only image files (JPEG, PNG, GIF, WebP).";
      } else if (error.message.includes('File too large')) {
        errorMessage = "File size too large. Please upload files smaller than 10MB.";
      } else if (error.message.includes('Missing required fields')) {
        errorMessage = "Please fill in all required fields.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow  pb-20">
        <section className="py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/30 to-background" />
          
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <GlassmorphicCard variant="default" shadow="md" className="p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-display font-bold mb-2">
                    Create New Auction
                  </h1>
                  <p className="text-muted-foreground">
                    List your antique item for auction
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {formError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 flex items-center">
                          <span className="mr-2">❌</span>
                          {formError}
                        </p>
                      </div>
                    )}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter auction title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <textarea
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              rows={4}
                              placeholder="Describe the item in detail"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Main Image</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                onChange(file);
                                if (formError) setFormError('');
                              }}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thumbnail"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Thumbnail</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                onChange(file);
                                if (formError) setFormError('');
                              }}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <select
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              {...field}
                            >
                              <option value="">Select a category</option>
                              {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="starting_bid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Bid ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reserve_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reserve Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="estimated_value_min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Value Min ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="estimated_value_max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Value Max ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auction End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? 'Creating...' : 'Create Auction'}
                    </Button>
                  </form>
                </Form>
              </GlassmorphicCard>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CreateAuction;
