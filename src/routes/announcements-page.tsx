import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnnouncementList } from '@/features/announcements/components/announcement-list';

export const AnnouncementsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Official news and updates from the city</p>
        </div>

        <AnnouncementList />
      </div>
    </div>
  );
};
