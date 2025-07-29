import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Logo } from '@/components/logo';

export default function Welcome() {
    const { auth, error } = usePage<SharedData>().props;
    const errorMessage =
        typeof error === 'string'
            ? error
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            : (error && typeof (error as any).message === 'string' ? (error as any).message
                                                                   : undefined);

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="relative flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a]">
                {/* Login button - top right corner */}
                <div className="absolute top-6 right-6 z-10">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="inline-block rounded-sm border border-[#19140035] px-4 py-2 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="inline-block rounded-sm border border-transparent px-4 py-2 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                        >
                            Log in
                        </Link>
                    )}
                </div>

                {/* Error message */}
                {errorMessage && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                        {errorMessage}
                    </div>
                )}

                {/* Main content - centered logo */}
                <div className="flex flex-1 items-center justify-center p-6">
                    <Logo className="h-80 w-80 lg:h-96 lg:w-96" />
                </div>
            </div>
        </>
    );
}
