// components/JobProgress.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Upload, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Contract, JobProgress as ProgressType } from '../types/labour';

export const JobProgress = () => {
  const { token } = useAuth();
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [progressData, setProgressData] = useState({
    progress_percentage: '',
    description: '',
    image_urls: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [jobProgress, setJobProgress] = useState<ProgressType[]>([]);

  useEffect(() => {
    fetchActiveContracts();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchJobProgress(selectedJob);
    }
  }, [selectedJob]);

  const fetchActiveContracts = async () => {
    try {
      const response = await fetch('https://verinest.up.railway.app/api/labour/contracts?status=active', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveContracts(data.contracts || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch active contracts:', error);
    }
  };

  const fetchJobProgress = async (jobId: string) => {
    try {
      // You might need to create this endpoint
      const response = await fetch(`https://verinest.up.railway.app/api/labour/jobs/${jobId}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobProgress(data.progress || data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch job progress:', error);
    }
  };

  const handleSubmitProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://verinest.up.railway.app/api/labour/jobs/${selectedJob}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress_percentage: parseInt(progressData.progress_percentage),
          description: progressData.description,
          image_urls: progressData.image_urls,
        }),
      });

      if (response.ok) {
        toast.success('Progress updated successfully!');
        setProgressData({ progress_percentage: '', description: '', image_urls: [] });
        fetchJobProgress(selectedJob);
      } else {
        throw new Error('Failed to update progress');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update progress');
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      const response = await fetch(`https://verinest.up.railway.app/api/labour/jobs/${jobId}/complete`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Job marked as completed!');
        fetchActiveContracts();
        setSelectedJob('');
      } else {
        throw new Error('Failed to complete job');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete job');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Job Progress</h1>
        <p className="text-muted-foreground">Update progress for your active jobs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Update Form */}
        <Card>
          <CardHeader>
            <CardTitle>Update Progress</CardTitle>
            <CardDescription>Submit progress updates for your active jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProgress} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job">Select Job</Label>
                <select
                  id="job"
                  className="w-full p-2 border rounded-md"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  required
                >
                  <option value="">Choose a job</option>
                  {activeContracts.map((contract) => (
                    <option key={contract.id} value={contract.job_id}>
                      {contract.job.title} - {contract.agreed_timeline} days
                    </option>
                  ))}
                </select>
              </div>

              {selectedJob && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="progress_percentage">Progress Percentage</Label>
                    <Input
                      id="progress_percentage"
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={progressData.progress_percentage}
                      onChange={(e) => setProgressData({ ...progressData, progress_percentage: e.target.value })}
                      placeholder="Enter progress percentage (0-100)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Progress Description</Label>
                    <Textarea
                      id="description"
                      required
                      placeholder="Describe what work has been completed, any challenges faced, and next steps..."
                      value={progressData.description}
                      onChange={(e) => setProgressData({ ...progressData, description: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Progress updates help employers track work and build trust. Include details about completed tasks and upcoming work.
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Updating Progress...' : 'Submit Progress Update'}
                  </Button>
                </>
              )}
            </form>

            {selectedJob && (
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => completeJob(selectedJob)}
                >
                  Mark Job as Completed
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress History */}
        <Card>
          <CardHeader>
            <CardTitle>Progress History</CardTitle>
            <CardDescription>Recent progress updates</CardDescription>
          </CardHeader>
          <CardContent>
            {jobProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No progress updates yet</p>
                <p className="text-sm">Submit your first progress update to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobProgress.map((progress) => (
                  <div key={progress.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{progress.progress_percentage}% Complete</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(progress.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {progress.progress_percentage}%
                      </Badge>
                    </div>
                    <Progress value={progress.progress_percentage} className="mb-2" />
                    <p className="text-sm text-muted-foreground">{progress.description}</p>
                    {progress.image_urls.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Images:</p>
                        <div className="flex gap-2">
                          {progress.image_urls.map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Progress ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};