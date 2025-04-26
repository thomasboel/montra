import yaml from 'js-yaml';
import fs from 'fs';

export function findComposeServiceByImage(
  dockerComposeFilePath: string,
  search: string,
): {
  serviceName: string;
  image: string;
} | null {
  if (!fs.existsSync(dockerComposeFilePath)) {
    throw new Error(
      `❌ docker-compose.yml not found at: ${dockerComposeFilePath}`,
    );
  }

  const fileContents = fs.readFileSync(dockerComposeFilePath, 'utf8');

  const coms = yaml.load(fileContents) as {
    services?: Record<string, { image?: string }>;
  };

  if (!coms.services) {
    throw new Error(`❌ No services found in coms compose file.`);
  }

  for (const [serviceName, serviceConfig] of Object.entries(coms.services)) {
    const image = serviceConfig.image;
    if (image && image.includes(search)) {
      return { serviceName, image };
    }
  }

  return null;
}
