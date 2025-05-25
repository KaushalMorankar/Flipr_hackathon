export default function QAAlerts({ violations }) {
  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Policy Violations</h2>
      {violations.length > 0 ? (
        <ul className="space-y-2">
          {violations.map((v, i) => (
            <li key={i} className="text-red-500 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {v}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-green-600">No violations detected</p>
      )}
    </div>
  );
}