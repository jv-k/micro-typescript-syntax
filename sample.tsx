export const Button: FC<Props> = ({ label, as }) => (
  <button type="button" className="btn" onClick={() => go(1)} aria-label={label}>
    Don't click <b>here</b> or <i>there</i>
    <Icon name="x" /> <Spacer />
  </button>
);
const items = useState<string[]>([]);
const n = a < b ? 1 : 2;
