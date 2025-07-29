import { SVGAttributes } from 'react';
import { Logo } from './logo';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return <Logo size="md" {...props} />;
}
