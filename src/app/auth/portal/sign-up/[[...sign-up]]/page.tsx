import { SignUp } from '@clerk/nextjs';

export default function PortalSignUpPage() {
  return (
    <div className='flex min-h-screen items-center justify-center p-6'>
      <SignUp
        path='/auth/portal/sign-up'
        routing='path'
        forceRedirectUrl='/portal'
        fallbackRedirectUrl='/portal'
        signInUrl='/auth/portal/sign-in'
        signInForceRedirectUrl='/portal'
      />
    </div>
  );
}
