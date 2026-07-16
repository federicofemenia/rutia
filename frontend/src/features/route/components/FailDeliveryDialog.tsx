import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { FAILURE_REASON_LABELS } from '../config/failureReasonConfig';
import { FailureReasonCode } from '../types';

interface FailDeliveryDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (failureReasonCode: FailureReasonCode, failureReasonDetail?: string) => void;
}

export function FailDeliveryDialog({ open, onClose, onConfirm }: FailDeliveryDialogProps) {
  const [selectedCode, setSelectedCode] = useState<FailureReasonCode>(FailureReasonCode.CustomerAbsent);
  const [detail, setDetail] = useState('');

  const handleClose = () => {
    setSelectedCode(FailureReasonCode.CustomerAbsent);
    setDetail('');
    onClose();
  };

  const handleConfirm = () => {
    const trimmedDetail = detail.trim();
    onConfirm(selectedCode, trimmedDetail.length > 0 ? trimmedDetail : undefined);
    handleClose();
  };

  const isOtherSelected = selectedCode === FailureReasonCode.Other;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>¿Por qué no se pudo entregar?</DialogTitle>
      <DialogContent>
        <FormControl>
          <RadioGroup
            value={selectedCode}
            onChange={(event) => setSelectedCode(event.target.value as FailureReasonCode)}
          >
            {Object.values(FailureReasonCode).map((code) => (
              <FormControlLabel key={code} value={code} control={<Radio />} label={FAILURE_REASON_LABELS[code]} />
            ))}
          </RadioGroup>
        </FormControl>

        {isOtherSelected && (
          <TextField
            label="Detalle"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 2 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={isOtherSelected && detail.trim().length === 0}>
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
