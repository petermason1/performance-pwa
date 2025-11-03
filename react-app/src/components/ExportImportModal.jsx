import { useState, useEffect } from 'react'
import { useApp } from '../hooks/useApp'

export default function ExportImportModal({ onClose }) {
  const { songs, setLists, dataStore, refreshData } = useApp()
  const [exportData, setExportData] = useState('')
  const [importData, setImportData] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState('')

  // Generate export data when modal opens
  useEffect(() => {
    const generateExportData = () => {
      try {
        // Reload from localStorage to ensure we have latest data
        dataStore.load()
        const allSongs = dataStore.getAllSongs()
        const allSetLists = dataStore.getAllSetLists()
        
        const allData = {
          songs: allSongs,
          setLists: allSetLists,
          version: '1.0',
          exportDate: new Date().toISOString(),
          stats: {
            songCount: allSongs.length,
            setListCount: allSetLists.length
          }
        }
        
        return JSON.stringify(allData, null, 2)
      } catch (e) {
        console.error('Error exporting data:', e)
        return ''
      }
    }

    const data = generateExportData()
    setExportData(data)
  }, [dataStore, songs, setLists])

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
    a.download = `performance-pwa-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportReplace = () => {
    importAllData(true)
  }

  const handleImportMerge = () => {
    importAllData(false)
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

  const importAllData = async (replace = true) => {
    const importText = importData.trim()
    
    if (!importText) {
      alert('Please upload a file or paste exported data first.')
      return
    }

    setIsImporting(true)

    try {
      // Always create backup before import
      const backupData = exportData || JSON.stringify({
        songs: dataStore.getAllSongs(),
        setLists: dataStore.getAllSetLists(),
        version: '1.0',
        exportDate: new Date().toISOString()
      }, null, 2)
      
      const backupKey = `backup_${Date.now()}`
      localStorage.setItem(backupKey, backupData)
      
      // Keep only last 5 backups
      const backupKeys = Object.keys(localStorage).filter(k => k.startsWith('backup_')).sort()
      if (backupKeys.length > 5) {
        backupKeys.slice(0, backupKeys.length - 5).forEach(k => localStorage.removeItem(k))
      }

      if (replace) {
        const currentSongs = dataStore.getAllSongs().length
        const currentSetLists = dataStore.getAllSetLists().length
        
        const message = `⚠️ This will REPLACE all your current data!\n\n` +
                      `Current: ${currentSongs} songs, ${currentSetLists} set lists\n` +
                      `Will be replaced with imported data.\n\n` +
                      `A backup has been saved. Continue?`
        
        if (!confirm(message)) {
          setIsImporting(false)
          return
        }
      }

      const data = JSON.parse(importText)
      
      // Validate data structure
      if (!Array.isArray(data.songs)) {
        throw new Error('Invalid data format. Expected songs array.')
      }
      
      if (!Array.isArray(data.setLists)) {
        throw new Error('Invalid data format. Expected setLists array.')
      }

      if (replace) {
        // Replace all data
        dataStore.songs = data.songs || []
        dataStore.setLists = data.setLists || []
      } else {
        // Merge data - add new songs/set lists without duplicates
        const existingSongNames = new Set(
          dataStore.getAllSongs().map(s => `${s.name}|${s.artist || ''}`.toLowerCase())
        )
        const existingSetListNames = new Set(
          dataStore.getAllSetLists().map(sl => sl.name.toLowerCase())
        )
        
        let newSongs = 0
        let skippedSongs = 0
        
        data.songs.forEach(song => {
          const key = `${song.name}|${song.artist || ''}`.toLowerCase()
          if (!existingSongNames.has(key)) {
            dataStore.songs.push(song)
            existingSongNames.add(key)
            newSongs++
          } else {
            skippedSongs++
          }
        })
        
        let newSetLists = 0
        let skippedSetLists = 0
        
        data.setLists.forEach(setList => {
          if (!existingSetListNames.has(setList.name.toLowerCase())) {
            dataStore.setLists.push(setList)
            existingSetListNames.add(setList.name.toLowerCase())
            newSetLists++
          } else {
            skippedSetLists++
          }
        })
        
        // Show merge results
        let message = `✅ Merged successfully!\n\n`
        message += `Songs: +${newSongs} new`
        if (skippedSongs > 0) message += `, ${skippedSongs} duplicates skipped`
        message += `\nSet Lists: +${newSetLists} new`
        if (skippedSetLists > 0) message += `, ${skippedSetLists} duplicates skipped`
        
        alert(message)
      }
      
      dataStore.save()
      
      // Reload from storage
      dataStore.load()
      
      console.log('Imported:', { songs: dataStore.getAllSongs().length, setLists: dataStore.getAllSetLists().length })
      
      // Refresh UI
      refreshData()
      
      // Close modal and clear import textarea
      setImportData('')
      setSelectedFileName('')
      
      // Reset file input if it exists
      const fileInput = document.getElementById('import-file-input')
      if (fileInput) {
        fileInput.value = ''
      }
      
      if (replace) {
        alert(`✅ Successfully imported ${data.songs.length} song${data.songs.length !== 1 ? 's' : ''} and ${data.setLists.length} set list${data.setLists.length !== 1 ? 's' : ''}!\n\n💾 Your previous data was automatically backed up.`)
      }
      
      onClose()
      
    } catch (e) {
      alert(`❌ Error importing data: ${e.message}\n\nMake sure you copied the complete JSON data.`)
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
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button id="copy-export-btn" className="btn btn-primary" onClick={handleCopyExport}>
              📋 Copy to Clipboard
            </button>
            <button id="download-export-btn" className="btn btn-secondary" onClick={handleDownloadExport}>
              💾 Download as File
            </button>
          </div>
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
