
// Ensure this file exports useAuthInternal as useAuth if that's the convention,
// or update imports throughout the app to useAuthInternal.
// For now, assuming useAuthInternal is the intended export name from AuthContext.
// If AuthContext directly exports useAuth, this file might need to change.

// Let's assume AuthContext.tsx will export its hook as useAuth for wider compatibility
// and this file will just re-export it. So AuthContext.tsx should export useAuth.
// Reverting AuthContext.tsx's hook export name to useAuth.

export { useAuthInternal as useAuth } from '@/context/AuthContext';
// If AuthContext.tsx exports useAuth, then:
// export { useAuth } from '@/context/AuthContext'; -> This is what was there.
// Let's stick to the original pattern and ensure AuthContext.tsx exports 'useAuth'.
// The previous thought process renamed it to useAuthInternal, so I'll revert that in AuthContext.tsx as well.
