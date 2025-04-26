import { Command } from '@commander-js/extra-typings';
import * as docker from '../../lib/docker/docker.js';

const listActiveContainers = new Command('activeContainers').action(
  async () => {
    const containers = await docker.getActiveContainers();

    console.log('containers', containers);
  },
);

const listPulledImages = new Command('pulledImages').action(async () => {
  const images = await docker.getPulledImages();

  console.log('images', images);
});

export default new Command('docker')
  .description('Test command for docker library')
  .addCommand(listPulledImages)
  .addCommand(listActiveContainers);
