import {
  Briefcase,
  MessageCircle,
  Award,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  AlertTriangle,
  Layers,
  Sparkles,
  Calendar,
  Wallet,
  MapPin,
  FileText,
  LayoutGrid,
  List,
  TrendingUp,
  ArrowUpRight,
  Check,
  Code2,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Icons — thin wrappers around lucide-react                                  */
/*                                                                            */
/* Every wrapper keeps the original `IconX({ className })` signature so no    */
/* call site elsewhere in the app needs to change. STROKE_WIDTH matches the   */
/* lighter weight the hand-drawn SVGs used to have (lucide defaults to 2).    */
/* -------------------------------------------------------------------------- */

const STROKE_WIDTH = 1.75;

function makeIcon(LucideComponent: LucideIcon) {
  return function Icon({ className = "" }: { className?: string }) {
    return (
      <LucideComponent
        className={className}
        strokeWidth={STROKE_WIDTH}
      />
    );
  };
}

export const IconBriefcase = makeIcon(Briefcase);
export const IconChat = makeIcon(MessageCircle);
export const IconAward = makeIcon(Award);
export const IconSearch = makeIcon(Search);
export const IconExternal = makeIcon(ExternalLink);
export const IconPencil = makeIcon(Pencil);
export const IconTrash = makeIcon(Trash2);
export const IconAlert = makeIcon(AlertTriangle);
export const IconLayers = makeIcon(Layers);
export const IconSparkle = makeIcon(Sparkles);
export const IconCalendar = makeIcon(Calendar);
export const IconWallet = makeIcon(Wallet);
export const IconMapPin = makeIcon(MapPin);
export const IconNote = makeIcon(FileText);
export const IconGrid = makeIcon(LayoutGrid);
export const IconList = makeIcon(List);
export const IconTrend = makeIcon(TrendingUp);
export const IconArrowUpRight = makeIcon(ArrowUpRight);
export const IconCheck = makeIcon(Check);
export const IconCode = makeIcon(Code2);
export const IconGlobe = makeIcon(Globe);
export const IconMail = makeIcon(Mail);
export const IconLock = makeIcon(Lock);
export const IconEye = makeIcon(Eye);
export const IconEyeOff = makeIcon(EyeOff);
export const IconUser = makeIcon(User); 
