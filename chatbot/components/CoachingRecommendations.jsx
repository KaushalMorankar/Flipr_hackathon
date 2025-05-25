export default function CoachingRecommendations({ recommendations }) {
  return (
    <div className="bg-white p-4 shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Training Recommendations</h2>
      {recommendations.length > 0 ? (
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li key={i} className="text-blue-600 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {rec}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recommendations needed</p>
      )}
    </div>
  );
}