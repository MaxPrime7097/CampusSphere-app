import React, { Suspense, lazy } from 'react';

const DotLottieReact = lazy(() => import('@lottiefiles/dotlottie-react').then(m => ({ default: m.DotLottieReact })));

const Sphere3D = () => {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center animate-pulse bg-primary/10 rounded-full" />}>
      <DotLottieReact
        src="https://lottie.host/083a07d6-b81b-4d28-92ca-f018a9d6a5ea/7ZmXwqU67b.lottie"
        stateMachineId="StateMachine1"
        className="w-full h-full"
      />
    </Suspense>
  );
};
 
export default Sphere3D;
