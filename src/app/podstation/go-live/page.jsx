import GoLivePanel from '@/components/podstation/GoLivePanel';

export const metadata = {
  title: 'Go Live | PodStation | MyStation',
  description: 'Start streaming live on MyStation PodStation.',
};

export default function GoLivePage() {
  return (
    <div className="min-h-screen py-8">
      <GoLivePanel />
    </div>
  );
}
