import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  return (
    <main className="app-shell">
      <section className="app-panel">
        <p className="eyebrow">Foundation</p>
        <h1>Library Management System</h1>
        <p className="lead">
          The frontend foundation is in place with the global theme, shared API client, and authentication
          bootstrap ready for the next tasks.
        </p>
        <div className="status-note" aria-live="polite">
          {loading
            ? 'Checking your saved session.'
            : user
              ? `Signed in as ${user.name} (${user.role}).`
              : 'No active session detected. Ready for the login flow in the next task.'}
        </div>
      </section>
    </main>
  );
}

export default App;
