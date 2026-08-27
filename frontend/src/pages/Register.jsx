import React from 'react';
import { SignUp } from '@clerk/clerk-react';

export default function Register() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Secure Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your terminal account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md flex justify-center">
        <SignUp 
          appearance={{
            elements: {
              card: "bg-white shadow-xl rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-gray-300 hover:bg-gray-50 text-gray-700",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-gray-900",
              footerActionLink: "text-indigo-600 hover:text-indigo-500",
            }
          }}
        />
      </div>
    </div>
  );
}
