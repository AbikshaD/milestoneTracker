import React, { useState } from 'react';
import { studentAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  FiUpload,
  FiDownload,
  FiFile,
  FiCheck,
  FiX,
  FiInfo
} from 'react-icons/fi';
import Papa from 'papaparse';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check if it's a CSV file
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error('Error parsing CSV file');
          setErrors(results.errors.map(err => err.message));
          return;
        }
        
        setPreview(results.data.slice(0, 5)); // Show first 5 rows as preview
        setErrors([]);
      },
      error: (error) => {
        toast.error('Error reading CSV file');
        console.error('CSV parse error:', error);
      }
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file first');
      return;
    }

    try {
      setUploading(true);
      const response = await studentAPI.bulkUpload(file);
      
      if (response.data.success) {
        toast.success(`Successfully uploaded ${response.data.data?.length || 0} students`);
        setFile(null);
        setPreview([]);
        setErrors([]);
        
        // Reset file input
        const fileInput = document.getElementById('csv-upload');
        if (fileInput) fileInput.value = '';
      } else if (response.data.errors) {
        setErrors(response.data.errors);
        toast.error('Some rows had errors. Please check below.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `studentId,name,email,class,department,year
ST001,John Doe,john@example.com,10,Science,1
ST002,Jane Smith,jane@example.com,10,Science,1
ST003,Bob Johnson,bob@example.com,11,Commerce,2`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Upload</h1>
        <p className="text-gray-600">Upload multiple student records via CSV</p>
      </div>

      {/* Upload Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FiUpload className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Upload CSV File
          </h3>
          <p className="text-gray-600 mb-6">
            Upload a CSV file containing student data. Download the template for reference.
          </p>

          {/* File Upload Area */}
          <div className="mb-6">
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors duration-200"
            >
              {file ? (
                <div className="text-center p-4">
                  <FiFile className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {preview.length} rows detected
                  </p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <FiUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    CSV file (max 5MB)
                  </p>
                </div>
              )}
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={downloadTemplate}
              className="btn-secondary flex items-center justify-center"
            >
              <FiDownload className="mr-2" />
              Download Template
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Upload CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Data Preview (First 5 rows)
            </h3>
            <p className="text-sm text-gray-600">
              Review your data before uploading
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0] || {}).map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FiX className="h-6 w-6 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-red-900">
              Upload Errors ({errors.length})
            </h3>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start p-3 bg-red-100 rounded"
              >
                <FiInfo className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <FiInfo className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-blue-900">Instructions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Required Columns</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <code className="bg-blue-100 px-1 rounded">studentId</code> - Unique student identifier</li>
              <li>• <code className="bg-blue-100 px-1 rounded">name</code> - Full name of student</li>
              <li>• <code className="bg-blue-100 px-1 rounded">email</code> - Valid email address</li>
              <li>• <code className="bg-blue-100 px-1 rounded">class</code> - Class/grade level</li>
              <li>• <code className="bg-blue-100 px-1 rounded">year</code> - Academic year (1-5)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Optional Columns</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <code className="bg-blue-100 px-1 rounded">department</code> - Department/Section</li>
              <li className="text-xs text-blue-600 mt-4">
                Note: File should be UTF-8 encoded. Maximum file size: 5MB.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;