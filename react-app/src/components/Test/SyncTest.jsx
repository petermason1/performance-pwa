import { useApp } from '../../hooks/useApp'
import { useBand } from '../../hooks/useBand'

export default function SyncTest() {
  const { addSong, songs } = useApp()
  const { currentBand } = useBand()

  const createTestSong = async () => {
    try {
      console.log('🧪 Creating test song...')
      const testSong = {
        name: 'Test Song ' + Date.now(),
        artist: 'Test Artist',
        bpm: 120,
        timeSignature: '4/4',
        lyrics: 'Test lyrics',
        helixPreset: 5
      }
      
      const result = await addSong(testSong)
      console.log('✅ Test song created:', result)
      alert('Test song created! Check Supabase to see if it synced.')
    } catch (error) {
      console.error('❌ Failed to create test song:', error)
      alert('Failed to create test song: ' + error.message)
    }
  }

  if (!currentBand) {
    return (
      <div className="p-4 bg-yellow-500/20 rounded-lg">
        <p>⚠️ No band selected. Create or join a band to test sync.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-green-500/20 rounded-lg p-4">
        <h3 className="font-bold mb-2">🔄 Sync Test Panel</h3>
        <p className="text-sm mb-4">Band: {currentBand.name}</p>
        <p className="text-sm mb-4">Local songs: {songs.length}</p>
        
        <button
          onClick={createTestSong}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
        >
          Create Test Song
        </button>
      </div>
      
      <div className="bg-blue-500/20 rounded-lg p-4">
        <h4 className="font-bold mb-2">📋 Instructions:</h4>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Click "Create Test Song"</li>
          <li>Open Supabase Dashboard → Table Editor → songs</li>
          <li>Check if the song appears with your band_id</li>
          <li>Open this app on another device/browser</li>
          <li>Sign in with a different account</li>
          <li>Join the band (click "+ Create Band" then use Invite)</li>
          <li>The song should appear on the other device!</li>
        </ol>
      </div>
    </div>
  )
}

