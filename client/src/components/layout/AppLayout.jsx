import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { getPageTitle } from './navigation';
import styles from './AppLayout.module.css';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const handleChange = (event) => {
      setIsMobile(event.matches);

      if (!event.matches) {
        setSidebarOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (!sidebarOpen || !isMobile) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className={styles.shell}>
      <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.mainColumn}>
        <Header
          isSidebarOpen={sidebarOpen}
          title={getPageTitle(location.pathname)}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
        />

        <main className={styles.content}>
          <div key={location.pathname} className={styles.pageFrame}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
