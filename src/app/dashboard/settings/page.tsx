import PageContainer from '@/components/layout/page-container';
import SettingsForm from '@/features/settings/components/settings-form';

export const metadata = {
  title: 'Dashboard: Settings'
};

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Configure company profile, document numbering, defaults, and approval rules.'
    >
      <SettingsForm />
    </PageContainer>
  );
}
