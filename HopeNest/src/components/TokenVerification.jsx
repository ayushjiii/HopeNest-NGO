import { useState, useEffect } from 'react';
import { 
  checkLocalStorageToken, 
  generateTokenReport, 
  testAPIEndpoint 
} from '../utils/tokenVerification';

export default function TokenVerification() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiTest, setApiTest] = useState(null);

  const runVerification = async () => {
    setLoading(true);
    try {
      const fullReport = await generateTokenReport();
      setReport(fullReport);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const result = await testAPIEndpoint('/api/auth/me');
      setApiTest(result);
    } catch (error) {
      console.error('API test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only run verification when explicitly requested, not on component mount
  // This prevents automatic checks that might cause loops

  const getStatusColor = (status) => {
    switch (status) {
      case 'valid':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'invalid':
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'no_token':
      case 'incomplete':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Token Verification Report
        </h3>
        <div className="space-x-2">
          <button
            onClick={runVerification}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Run Verification'}
          </button>
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Test API
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          {/* LocalStorage Status */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">LocalStorage Status</h4>
            <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${getStatusColor(report.localStorage.status)}`}>
              {report.localStorage.status}
            </div>
            
            {report.localStorage.token && (
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Token:</span>
                  <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    {report.localStorage.token.substring(0, 50)}...
                  </code>
                </div>
                {report.localStorage.userName && (
                  <div className="text-sm">
                    <span className="font-medium">Stored Name:</span>
                    <span className="ml-2">{report.localStorage.userName}</span>
                  </div>
                )}
                {report.localStorage.decoded && (
                  <div className="text-sm">
                    <span className="font-medium">User ID:</span>
                    <span className="ml-2">{report.localStorage.decoded.userId}</span>
                  </div>
                )}
                {report.localStorage.decoded && (
                  <div className="text-sm">
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{report.localStorage.decoded.email}</span>
                  </div>
                )}
                {report.localStorage.decoded && report.localStorage.decoded.exp && (
                  <div className="text-sm">
                    <span className="font-medium">Expires:</span>
                    <span className="ml-2">
                      {new Date(report.localStorage.decoded.exp * 1000).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors */}
            {report.localStorage.validation?.errors?.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-red-700">Errors:</h5>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {report.localStorage.validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Validation Warnings */}
            {report.localStorage.validation?.warnings?.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium text-yellow-700">Warnings:</h5>
                <ul className="text-sm text-yellow-600 list-disc list-inside">
                  {report.localStorage.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* API Endpoint Test */}
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">API Endpoint Test</h4>
            <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
              report.apiEndpoint.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
            }`}>
              {report.apiEndpoint.success ? 'Success' : 'Failed'}
            </div>
            
            <div className="mt-3 space-y-2">
              <div className="text-sm">
                <span className="font-medium">Status:</span>
                <span className="ml-2">{report.apiEndpoint.status || 'N/A'}</span>
              </div>
              {report.apiEndpoint.data && (
                <div className="text-sm">
                  <span className="font-medium">Response:</span>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(report.apiEndpoint.data, null, 2)}
                  </pre>
                </div>
              )}
              {report.apiEndpoint.error && (
                <div className="text-sm text-red-600">
                  <span className="font-medium">Error:</span>
                  <span className="ml-2">{report.apiEndpoint.error}</span>
                </div>
              )}
            </div>
          </div>

          {/* Separate API Test Result */}
          {apiTest && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Manual API Test Result</h4>
              <div className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
                apiTest.success ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
              }`}>
                {apiTest.success ? 'Success' : 'Failed'}
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Status:</span>
                  <span className="ml-2">{apiTest.status || 'N/A'}</span>
                </div>
                {apiTest.data && (
                  <div className="text-sm">
                    <span className="font-medium">Response:</span>
                    <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(apiTest.data, null, 2)}
                    </pre>
                  </div>
                )}
                {apiTest.error && (
                  <div className="text-sm text-red-600">
                    <span className="font-medium">Error:</span>
                    <span className="ml-2">{apiTest.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                {report.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Report */}
          <details className="border rounded-lg p-4">
            <summary className="font-medium text-gray-900 cursor-pointer">
              Raw Report Data
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(report, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      {!report && !loading && (
        <div className="text-center py-4 text-gray-500">
          Click "Run Verification" to check token status
        </div>
      )}
    </div>
  );
}