import { useState, useCallback } from 'react';

/**
 * Custom hook for managing scan state and API calls.
 * @param {(message: string, type?: string) => void} addToast - Function to show toast notifications.
 * @returns {object} - An object containing scan state and functions.
 */
export function useScanner(addToast) {
  const [scanReport, setScanReport] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const scan = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanReport(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Could not read error response.");
        throw new Error(`Scan failed: Server responded with status ${res.status}. Details: ${errorText}`);
      }

      const data = await res.json();
      if (data.ok) {
        setScanReport(data);
      } else {
        throw new Error(data.error || "An unknown error occurred during the scan.");
      }
    } catch (err) {
      console.error("An error occurred while scanning:", err);
      setScanReport({ error: err.message });
    } finally {
      setIsScanning(false);
    }
  }, [isScanning]);

  const rescanFile = useCallback(async (filePath) => {
    try {
      const scanResponse = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });

      if (!scanResponse.ok) throw new Error(await scanResponse.text());
      return await scanResponse.json();
    } catch (err) {
      console.error('Error during file rescan:', err);
      addToast(`Rescan Error: ${err.message}`, 'error');
      return null;
    }
  }, [addToast]);

  return { scanReport, setScanReport, isScanning, scan, rescanFile };
}