import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { ChevronDown, ChevronUp } from "lucide-react";
import {  useState } from "react";

export default function ListMenu({
  mediaDevices,
  kind,
  selectDevice,
  activeDeviceId,
}: {
  mediaDevices: MediaDeviceInfo[];
  kind: "audioinput" | "videoinput";
  selectDevice: (deviceId: string, kind: "audioinput" | "videoinput") => void;
  activeDeviceId: string;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <button
        className="text-white px-2 flex justify-center items-center"
        id="basic-button"
        onClick={handleClick}
      >
        {anchorEl ? <ChevronUp /> : <ChevronDown />}
      </button>
      <Menu
        className=""
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "basic-button",
          },
        }}
      >
        {mediaDevices &&
          mediaDevices.length > 0 &&
          mediaDevices
            .filter((d) => d.kind === kind)
            .map((device, idx) => (
              <MenuItem
                key={idx}
                onClick={() => {
                  selectDevice(device.deviceId, kind);
                }}
                sx={{
                  backgroundColor:
                    device.deviceId === activeDeviceId
                      ? "rgb(96 165 250)"
                      : "",

                  "&:hover": {
                    backgroundColor:
                      device.deviceId === activeDeviceId
                        ? "rgb(96 165 250)"
                        : "",
                  },
                }}
              >
                {device.label || "Unnamed Device"}
              </MenuItem>
            ))}
      </Menu>
    </div>
  );
}
