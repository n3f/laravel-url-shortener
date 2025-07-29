import logoSvg from '@assets/logo.svg';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = "", size = 'md' }: LogoProps) {
    const sizeClasses = {
        sm: 'h-6 w-6',      // 24px - for small contexts
        md: 'h-9 w-9',      // 36px - for auth pages
        lg: 'h-12 w-12',    // 48px - for headers
        xl: 'h-80 w-80 lg:h-96 lg:w-96' // 320-384px - for welcome page
    };

    return (
        <img
            src={logoSvg}
            alt="Logo"
            className={`${sizeClasses[size]} ${className}`}
        />
    );
}
