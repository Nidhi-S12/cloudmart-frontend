export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo">CloudMart</span>
          <p>A cloud-native microservices e-commerce platform built with modern DevOps practices.</p>
        </div>
        <div className="footer-links">
          <h4>Tech Stack</h4>
          <ul>
            <li>Next.js + React</li>
            <li>Node.js + FastAPI</li>
            <li>PostgreSQL + Redis</li>
            <li>Kafka + ArgoCD</li>
          </ul>
        </div>
        <div className="footer-links">
          <h4>Infrastructure</h4>
          <ul>
            <li>AWS EKS</li>
            <li>Terraform</li>
            <li>GitHub Actions</li>
            <li>Prometheus + Grafana</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CloudMart. Built as a DevOps portfolio project.</p>
      </div>
    </footer>
  );
}
