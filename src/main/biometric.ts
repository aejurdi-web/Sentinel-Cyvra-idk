import os from 'os';
import logger from '../utils/logger';

export async function biometricUnlock(): Promise<boolean> {
  try {
    if (os.platform() === 'win32') {
      const { default: windowsHello } = await import('node-windows-hello');
      return windowsHello.verifyUser({ reason: 'Unlock Sentinel Vault' });
    }
    if (os.platform() === 'darwin') {
      const { default: touchId } = await import('node-mac-touchid');
      return touchId();
    }
    logger.warn('Biometric unlock not supported on this platform.');
    return false;
  } catch (error) {
    logger.error('Biometric unlock failed', error);
    return false;
  }
}
