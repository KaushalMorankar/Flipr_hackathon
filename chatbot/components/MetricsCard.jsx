export default function MetricsCard({ title, value, description }) {
  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  );
}