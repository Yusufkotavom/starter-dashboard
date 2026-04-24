import PageContainer from '@/components/layout/page-container';
import ModulePlaceholder from '@/components/layout/module-placeholder';

export const metadata = {
  title: 'Dashboard: Settings'
};

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Configure company profile, invoicing defaults, and financial preferences.'
    >
      <ModulePlaceholder
        title='Agency settings are queued for phase 3.'
        description='This section will centralize business-level configuration once the sales and finance workflows are fully functional.'
        bullets={[
          'Company profile, invoice numbering, tax defaults, and payment terms belong here.',
          'This route complements Clerk profile and billing by covering business settings rather than user account settings.',
          'Keeping the placeholder live makes the final agency information architecture visible now.'
        ]}
      />
    </PageContainer>
  );
}
