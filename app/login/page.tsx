'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6">
            <h1 className="text-2xl font-bold mb-6">🧠 Tier Master에 로그인</h1>

            <button
                onClick={() => signIn('google', { callbackUrl: '/vote' })}
                className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded shadow hover:shadow-md transition"
            >
                <Image
                    src="https://developers.google.com/identity/images/g-logo.png"
                    width={20}
                    height={20}
                    alt="Google logo"

                />
                <span className="text-sm text-gray-700 font-medium">
                    Google 계정으로 로그인
                </span>
            </button>
        </div>
    );
}
