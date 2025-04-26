import Docker from 'dockerode';

export async function getActiveContainers(): Promise<string[]> {
  const docker = new Docker();

  const containers = await docker.listContainers();

  return containers.map((container) => {
    const name = container.Names[0];
    return name.startsWith('/') ? name.substring(1) : name;
  });
}

export async function stopContainerByPort(port: number): Promise<void> {
  const docker = new Docker();

  const containers = await docker.listContainers();

  const container = containers.find((container) => {
    return container.Ports && container.Ports.some((p) => p.PublicPort == port);
  });

  if (!container) {
    return;
  }

  const containerInstance = docker.getContainer(container.Id);
  await containerInstance.stop();
}

export async function getPulledImages(): Promise<string[]> {
  const docker = new Docker();

  const images = await docker.listImages();

  return images
    .filter(
      (image): image is typeof image & { RepoTags: string[] } =>
        Array.isArray(image.RepoTags) && image.RepoTags.length > 0,
    )
    .map((image) => image.RepoTags[0]);
}
