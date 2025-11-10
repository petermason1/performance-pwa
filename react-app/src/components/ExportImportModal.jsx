import { useState, useEffect, useRef } from 'react'
import { useApp } from '../hooks/useApp'
import QRCode from 'qrcode'

export default function ExportImportModal({ onClose }) {
  const { songs, setLists, exportData: exportAppData, importData: importAppData, refreshSongs } = useApp()
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const qrCanvasRef = useRef(null)

  // Generate export data when modal opens
  useEffect(() => {
    const generateExportData = async () => {
      setIsExporting(true)
      try {
        const data = await exportAppData()
        const jsonString = JSON.stringify(data, null, 2)
        setExportData(jsonString)
      } catch (e) {
        console.error('Error exporting data:', e)
        setExportData('')
        alert('Failed to export data: ' + e.message)
      } finally {
        setIsExporting(false)
      }
    }

    generateExportData()
  }, [exportAppData])

  const handleCopyExport = async () => {
    if (!exportData || exportData.trim() === '') {
      alert('No data to copy. Export data first.')
      return
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(exportData)
        alert('✅ Data copied to clipboard!')
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = exportData
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        alert('✅ Data copied to clipboard!')
      }
    } catch (e) {
      console.error('Copy failed:', e)
      alert('Failed to copy. Please copy manually from the text area.')
    }
  }

  const handleDownloadExport = () => {
    if (!exportData || exportData.trim() === '') {
      alert('No data to download.')
      return
    }

    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metronome-backup-${new Date().toISOString().split('T')[0]}.metronome.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('✅ File downloaded!')
  }

  const handleGenerateShareLink = async () => {
    if (!exportData || exportData.trim() === '') {
      alert('No data to share.')
      return
    }

    try {
      // Compress and encode data for URL
      const compressed = btoa(encodeURIComponent(exportData))
      const url = `${window.location.origin}${window.location.pathname}?import=${compressed}`
      
      // Check URL length (browsers have limits ~2048 chars for IE, ~8000+ for modern)
      if (url.length > 8000) {
        alert('⚠️ Data too large for share link (over 8000 characters).\n\nPlease use "Download as File" instead and share the file.')
        return
      }
      
      setShareLink(url)
      
      // Generate QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        })
        setQrCodeUrl(qrDataUrl)
      } catch (qrErr) {
        console.error('Error generating QR code:', qrErr)
        // Continue without QR code
      }
    } catch (e) {
      console.error('Error generating share link:', e)
      alert('Failed to generate share link. Data may be too large.')
    }
  }

  const handleCopyShareLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareLink)
        alert('✅ Share link copied to clipboard!')
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = shareLink
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        alert('✅ Share link copied to clipboard!')
      }
    } catch (e) {
      console.error('Copy failed:', e)
      alert('Failed to copy. Please copy manually.')
    }
  }

  const handleImportReplace = () => {
    importAllData('replace')
  }

  const handleImportMerge = () => {
    importAllData('merge')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type (optional, but helpful)
    if (file.type && !file.type.includes('json') && !file.name.endsWith('.json')) {
      if (!confirm('File does not appear to be JSON. Continue anyway?')) {
        e.target.value = '' // Reset file input
        return
      }
    }

    setSelectedFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target.result
        // Validate JSON before setting
        JSON.parse(content)
        setImportData(content)
      } catch (e) {
        alert(`❌ Error reading file: ${e.message}\n\nPlease make sure the file contains valid JSON data.`)
        setSelectedFileName('')
        e.target.value = '' // Reset file input
      }
    }
    reader.onerror = () => {
      alert('❌ Error reading file. Please try again.')
      setSelectedFileName('')
      e.target.value = '' // Reset file input
    }
    reader.readAsText(file)
  }

  const importAllData = async (mode = 'merge') => {
    const importText = importData.trim()
    
    if (!importText) {
      alert('Please upload a file or paste exported data first.')
      return
    }

    setIsImporting(true)

    try {
      // Parse and validate data
      const data = JSON.parse(importText)
      
      // Validate data structure
      if (!data.songs || !Array.isArray(data.songs)) {
        throw new Error('Invalid data format. Expected songs array.')
      }
      
      if (!data.setlists && !data.setLists) {
        throw new Error('Invalid data format. Expected setlists array.')
      }

      // Normalize setlists key (handle both old and new formats)
      if (data.setLists && !data.setlists) {
        data.setlists = data.setLists
      }

      if (mode === 'replace') {
        const message = `⚠️ This will REPLACE all your current data!\n\n` +
                      `Current: ${songs.length} songs, ${setLists.length} set lists\n` +
                      `Will be replaced with: ${data.songs.length} songs, ${data.setlists.length} set lists\n\n` +
                      `Continue?`
        
        if (!confirm(message)) {
          setIsImporting(false)
          return
        }
      }

      // Import data using IndexedDB
      const result = await importAppData(data, mode)
      
      console.log('Import result:', result)
      
      // Build result message
      let message = ''
      if (mode === 'replace') {
        message = `✅ Successfully replaced all data!\n\n` +
                 `Imported: ${result.songs.added} songs, ${result.setlists.added} set lists`
        if (result.presets?.added) message += `, ${result.presets.added} presets`
      } else {
        message = `✅ Merge complete!\n\n` +
                 `Songs: +${result.songs.added} new`
        if (result.songs.skipped > 0) message += `, ${result.songs.skipped} skipped (already exist)`
        message += `\nSet Lists: +${result.setlists.added} new`
        if (result.setlists.skipped > 0) message += `, ${result.setlists.skipped} skipped (already exist)`
        if (result.presets?.added) {
          message += `\nPresets: +${result.presets.added} new`
          if (result.presets.skipped > 0) message += `, ${result.presets.skipped} skipped (already exist)`
        }
      }
      
      if (result.songs.errors.length > 0 || result.setlists.errors.length > 0 || result.presets?.errors.length > 0) {
        message += `\n\n⚠️ Some items had errors and were not imported.`
        console.error('Import errors:', result)
      }
      
      alert(message)
      
      // Clear import textarea and file
      setImportData('')
      setSelectedFileName('')
      
      const fileInput = document.getElementById('import-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
      
      onClose()
      
    } catch (e) {
      alert(`❌ Error importing data: ${e.message}\n\nMake sure you have valid JSON data.`)
      console.error('Import error:', e)
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('close')) {
      onClose()
    }
  }

  return (
    <div className="modal" style={{ display: 'block' }} onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={handleClose}>&times;</span>
        <h2>Export/Import All Data</h2>
        
        {/* Export Section */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>📤 Export All Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Copy all your songs and set lists to transfer to another device (phone, tablet, etc.)
          </p>
          <textarea
            id="export-data-textarea"
            readOnly
            value={exportData}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              background: 'var(--surface-light)'
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button id="copy-export-btn" className="btn btn-primary" onClick={handleCopyExport} disabled={isExporting}>
              📋 Copy to Clipboard
            </button>
            <button id="download-export-btn" className="btn btn-secondary" onClick={handleDownloadExport} disabled={isExporting}>
              💾 Download as File
            </button>
            <button id="share-link-btn" className="btn btn-secondary" onClick={handleGenerateShareLink} disabled={isExporting}>
              🔗 Generate Share Link
            </button>
          </div>
          
          {shareLink && (
            <div style={{
              marginTop: '15px',
              padding: '15px',
              background: 'var(--surface-light)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                📤 Share Link Generated
              </div>
              
              {qrCodeUrl && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '15px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '8px'
                }}>
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code for sharing data" 
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Scan this QR code to import on another device
                  </div>
                </div>
              )}
              
              <textarea
                readOnly
                value={shareLink}
                style={{
                  width: '100%',
                  minHeight: '60px',
                  padding: '8px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  background: 'white',
                  marginBottom: '10px'
                }}
              />
              <button className="btn btn-primary" onClick={handleCopyShareLink}>
                📋 Copy Share Link
              </button>
              <div style={{
                marginTop: '10px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                💡 Anyone with this link can import your songs and set lists.
              </div>
            </div>
          )}
        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '30px 0' }} />
        
        {/* Import Section */}
        <div>
          <h3 style={{ marginBottom: '15px' }}>📥 Import Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Upload a JSON file from your device or paste exported data here. Choose "Replace" to wipe existing data, or "Merge" to add new items.
          </p>
          
          {/* File Upload Section */}
          <div style={{ marginBottom: '15px' }}>
            <input
              type="file"
              id="import-file-input"
              accept=".json,application/json"
              onChange={handleFileSelect}
              disabled={isImporting}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="import-file-input"
              className="btn btn-secondary"
              style={{
                display: 'inline-block',
                cursor: isImporting ? 'not-allowed' : 'pointer',
                opacity: isImporting ? 0.6 : 1,
                marginBottom: '10px'
              }}
            >
              📁 Choose File from Device
            </label>
            {selectedFileName && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                background: 'var(--surface-light)',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'inline-block'
              }}>
                ✓ Selected: <strong>{selectedFileName}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFileName('')
                    setImportData('')
                    const fileInput = document.getElementById('import-file-input')
                    if (fileInput) fileInput.value = ''
                  }}
                  style={{
                    marginLeft: '10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '0 4px'
                  }}
                  title="Clear file"
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: 'var(--surface-light)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <strong>📱 Mobile Tip:</strong> Use "Choose File" to select a JSON backup from your phone's storage (Downloads, Files app, etc.)
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            margin: '15px 0',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            <strong>OR</strong>
          </div>

          <textarea
            id="import-data-textarea"
            placeholder="Paste exported data here (or use file upload above)..."
            value={importData}
            onChange={(e) => {
              setImportData(e.target.value)
              // Clear file name if user is typing
              if (selectedFileName) {
                setSelectedFileName('')
                const fileInput = document.getElementById('import-file-input')
                if (fileInput) fileInput.value = ''
              }
            }}
            disabled={isImporting}
            style={{
              width: '100%',
              minHeight: '200px',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              id="import-data-replace-btn"
              className="btn btn-danger"
              onClick={handleImportReplace}
              disabled={isImporting}
            >
              ⚠️ Replace All Data
            </button>
            <button
              id="import-data-merge-btn"
              className="btn btn-primary"
              onClick={handleImportMerge}
              disabled={isImporting}
            >
              {isImporting ? 'Importing...' : '➕ Merge Data'}
            </button>
            <button
              type="button"
              className="btn btn-secondary cancel-btn"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </button>
          </div>
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: 'var(--surface-light)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>Replace:</strong> Removes all current data and imports new data.{' '}
            <span style={{ color: 'var(--accent)' }}>⚠️ A backup is automatically created first!</span><br />
            <strong>Merge:</strong> Adds new songs/set lists without deleting existing ones. Duplicates (by name) are skipped.<br />
            <small style={{ color: 'var(--text-secondary)', marginTop: '5px', display: 'block' }}>
              💡 Tip: Export your data first if you want a manual backup.
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}
