import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import AutoImport from 'unplugin-auto-import/vite'

const base = process.env.BASE_PATH || '/'
const isPreview = process.env.IS_PREVIEW  ? true : false;

// Expose explicitement les variables Cloudinary pour le build
const cloudinaryCloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const cloudinaryUploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

// https://vite.dev/config/
export default defineConfig({
  define: {
   __BASE_PATH__: JSON.stringify(base),
   __IS_PREVIEW__: JSON.stringify(isPreview),
   'import.meta.env.VITE_CLOUDINARY_CLOUD_NAME': JSON.stringify(cloudinaryCloudName),
   'import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET': JSON.stringify(cloudinaryUploadPreset),
  },
  plugins: [react(),
    AutoImport({
      imports: [
        {
          'react': [
            'useState',
            'useEffect',
            'useContext',
            'useReducer',
            'useCallback',
            'useMemo',
            'useRef',
            'useImperativeHandle',
            'useLayoutEffect',
            'useDebugValue',
            'useDeferredValue',
            'useId',
            'useInsertionEffect',
            'useSyncExternalStore',
            'useTransition',
            'startTransition',
            'lazy',
            'memo',
            'forwardRef',
            'createContext',
            'createElement',
            'cloneElement',
            'isValidElement'
          ]
        },
        {
          'react-router-dom': [
            'useNavigate',
            'useLocation',
            'useParams',
            'useSearchParams',
            'Link',
            'NavLink',
            'Navigate',
            'Outlet'
          ]
        },
        // React i18n
        {
          'react-i18next': [
            'useTranslation',
            'Trans'
          ]
        }
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom']
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  }
})
