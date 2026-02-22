/**
 * Manual mock for lucide-react.
 * lucide-react barrel file exports ~2000 icon components.
 * Loading them all without tree-shaking causes OOM in test workers.
 * This Proxy returns a stub component for any icon name.
 */
export default new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '__esModule') return true;
      if (prop === 'default') return {};
      return function LucideStub() {
        return null;
      };
    },
  },
);

// Re-export everything through named exports via Proxy
const handler = {
  get(_target, prop) {
    if (prop === '__esModule') return true;
    return function LucideStub() {
      return null;
    };
  },
};

const mod = new Proxy({}, handler);

export const Save = mod.Save;
export const Camera = mod.Camera;
export const Calendar = mod.Calendar;
export const LoaderCircle = mod.LoaderCircle;
export const Star = mod.Star;
export const Trash2 = mod.Trash2;
export const MapPin = mod.MapPin;
export const ArrowUp = mod.ArrowUp;
export const ArrowDown = mod.ArrowDown;
export const Plus = mod.Plus;
export const Search = mod.Search;
export const Upload = mod.Upload;
export const X = mod.X;
export const Image = mod.Image;
export const Check = mod.Check;
export const ChevronDown = mod.ChevronDown;
export const ChevronUp = mod.ChevronUp;
export const ChevronLeft = mod.ChevronLeft;
export const ChevronRight = mod.ChevronRight;
export const Menu = mod.Menu;
export const Home = mod.Home;
export const Settings = mod.Settings;
export const User = mod.User;
export const Mail = mod.Mail;
export const Bell = mod.Bell;
export const Heart = mod.Heart;
export const Edit = mod.Edit;
export const Eye = mod.Eye;
export const EyeOff = mod.EyeOff;
export const LogOut = mod.LogOut;
export const AlertCircle = mod.AlertCircle;
export const Info = mod.Info;
export const Loader = mod.Loader;
export const RefreshCw = mod.RefreshCw;
export const Share = mod.Share;
export const Copy = mod.Copy;
export const Clipboard = mod.Clipboard;
export const Globe = mod.Globe;
export const Map = mod.Map;
export const Navigation = mod.Navigation;
export const Plane = mod.Plane;
