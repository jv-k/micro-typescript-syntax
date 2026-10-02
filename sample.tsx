export const Button: FC<Props> = ({ label, as }) => (
  <button type="button" className="btn" onClick={() => go(1)} aria-label={label}>
    Don't click <b>here</b> or <i>there</i>
    <Icon name="x" /> <Spacer />
  </button>
);
const items = useState<string[]>([]);
const n = a < b ? 1 : 2;
const Layout: FC<PropsWithChildren> = ({ children }): ReactElement => <main>{children}</main>;
function Page({ slot }: { slot: ReactNode }): JSX.Element {
  const router = useRouter();
  const [n, setN] = useState<number>(0);
  return <Layout>{slot}</Layout>;
}
const useThing = () => React.useMemo(() => 1, []);
const user = 1; const reuse = 2;
