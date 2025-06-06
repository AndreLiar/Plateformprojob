import MyJobsList from '@/components/dashboard/MyJobsList';

export default function DashboardPage() {
  // This page will render the MyJobsList component by default.
  // Could be a summary page in the future.
  return (
    <div>
      <MyJobsList />
    </div>
  );
}
