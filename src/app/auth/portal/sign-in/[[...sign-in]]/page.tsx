import { SignIn } from '@clerk/nextjs';

export default function PortalSignInPage() {
  return (
    <div className='flex min-h-screen items-center justify-center p-6'>
      <SignIn
        path='/auth/portal/sign-in'
        routing='path'
        forceRedirectUrl='/portal'
        fallbackRedirectUrl='/portal'
        signUpUrl='/auth/portal/sign-up'
        signUpForceRedirectUrl='/portal'
      />
    </div>
  );
}
