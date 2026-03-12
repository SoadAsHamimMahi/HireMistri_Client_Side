export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10 ${className}`.trim()}>
      {children}
    </div>
  );
}
