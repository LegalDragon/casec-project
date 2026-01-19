import { useTheme } from './ThemeProvider';
import { Link } from 'react-router-dom';
import { getAssetUrl } from '../services/api';

export default function LogoOrText() {
  const { theme } = useTheme();

  if (theme?.logoUrl) {
    return (
      <Link to="/dashboard" className="flex items-center">
        <img
          src={getAssetUrl(theme.logoUrl)}
          alt={theme.organizationName || 'Logo'}
          className="h-14 w-auto max-w-[200px] object-contain"
        />
      </Link>
    );
  }

  return (
    <Link to="/dashboard" className="text-3xl font-display font-extrabold text-primary">
      {theme?.organizationName || 'CASEC'}<span className="text-accent">.</span>
    </Link>
  );
}
