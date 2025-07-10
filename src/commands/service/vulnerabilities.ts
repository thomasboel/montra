import { Command } from '@commander-js/extra-typings';

import store from '../../utils/store.js';
import { withErrorHandler } from '../../utils/errorHandler.js';
import { execute } from '../../lib/exec.js';
import { prettyPrintKeyValue } from '../../utils/prettyPrintKeyValue.js';

interface ImageScanFindings {
  imageScanFindings: {
    enhancedFindings: {
      awsAccountId: string;
      description: string;
      findingArn: string;
      firstObservedAt: string;
      lastObservedAt: string;
      packageVulnerabilityDetails: {
        cvss: {
          baseScore: number;
          scoringVector: string;
          source: 'NVD' | 'NODE' | 'OS' | 'PYTHON';
          version: string; // number
        }[];
        referenceUrls: string[];
        relatedVulnerabilities: any[];
        source: 'NVD' | 'NODE' | 'OS' | 'PYTHON';
        sourceUrl: string;
        vendorCreatedAt: string;
        vendorSeverity: 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LOW';
        vendorUpdatedAt: string;
        vulnerabilityId: string; // e.g. 'CVE-2025-5064'
        vulnerablePackages: [
          {
            epoch: number;
            filePath: string; // '/usr/src/app/node_modules/puppeteer/package.json'
            name: string; // 'google/puppeteer'
            packageManager: string; // 'GENERIC'
            sourceLayerHash: string;
            version: string; // '24.7.2'
            fixedInVersion: string; // e.g. 25.0.0 or NotAvailable
          },
        ];
      };
      remediation: {
        recommendation: {
          text: string;
        };
      };
      score: number;
      severity: 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'LOW';
      status: 'SUPPRESSED' | string;
      title: string; // .e.g CVE-2025-5064 - google/puppeteer
      type: string; // e.g. 'PACKAGE_VULNERABILITY'
      updatedAt: string;
      fixAvailable: 'NO' | 'YES';
      exploitAvailable: 'NO' | 'YES';
    }[];
    imageScanStatus: {
      status: string;
      description: string;
    };
    imageScanCompletedAt: string;
    vulnerabilitySourceUpdatedAt: string;
    findingSeverityCounts: {
      MEDIUM: number;
      HIGH: number;
      CRITICAL: number;
      LOW: number;
    };
  };
  registryId: string;
  repositoryName: string;
  imageId: {
    imageDigest: string;
    imageTag: string;
  };
  imageScanStatus: {
    status: string;
    description: string;
  };
}

interface VulnerabilityInfo {
  title: string;
  severity: string;
  score: number;
  type: string;
  fixAvailable: string;
  exploitAvailable: string;
  package: string;
  packageManager: string;
  filePath: string;
  version: string;
  fixedInVersion: string;
}

export async function vulnerabilities(
  serviceName: string,
  { json }: { json: boolean },
): Promise<void> {
  const service = store
    .get('services')
    .find((s) => [s.name, s.alias].includes(serviceName));

  if (!service) {
    throw new Error(`Service with the name ${serviceName} does not exist`);
  }

  const ecrImageTagResult = await execute(
    `aws ecr describe-images --repository-name ${service.repository} --region eu-west-1 --query 'sort_by(imageDetails,& imagePushedAt)[-1].imageTags[0]' --output text`,
  );

  if (!ecrImageTagResult.success) {
    throw new Error(
      `Failed to get the latest ECR image tag for ${serviceName}. Check that you have the AWS CLI configured correctly to read from production.`,
    );
  }

  const ecrImageTag = ecrImageTagResult.stdout.trim();

  const imageScanFindingsResult = await execute(
    `aws ecr describe-image-scan-findings --repository-name ${service.repository} --image-id imageTag=${ecrImageTag} --region eu-west-1`,
  );

  if (!imageScanFindingsResult.success) {
    throw new Error(
      `Failed to get the image scan findings for ${serviceName}. Checked image tag: ${ecrImageTag}`,
    );
  }

  const imageScanFindings: ImageScanFindings = JSON.parse(
    imageScanFindingsResult.stdout,
  );

  const vulnerabilityInfos =
    imageScanFindings.imageScanFindings.enhancedFindings.map((finding) =>
      getVulnerabilityInfo(finding),
    );

  if (json) {
    console.log(JSON.stringify(vulnerabilityInfos, null, 2));
    return;
  }

  for (const vulnerabilityInfo of vulnerabilityInfos) {
    printVulnerabilityFinding(vulnerabilityInfo);
  }
}

function getVulnerabilityInfo(
  finding: ImageScanFindings['imageScanFindings']['enhancedFindings'][number],
): VulnerabilityInfo {
  return {
    title: finding.title,
    severity: finding.severity,
    score: finding.score,
    type: finding.type,
    fixAvailable: finding.fixAvailable,
    exploitAvailable: finding.fixAvailable,
    package: finding.packageVulnerabilityDetails?.vulnerablePackages[0]?.name,
    packageManager:
      finding.packageVulnerabilityDetails?.vulnerablePackages[0]
        ?.packageManager,
    filePath:
      finding.packageVulnerabilityDetails?.vulnerablePackages[0]?.filePath,
    version:
      finding.packageVulnerabilityDetails?.vulnerablePackages[0]?.version,
    fixedInVersion:
      finding.packageVulnerabilityDetails?.vulnerablePackages[0]
        ?.fixedInVersion,
  };
}

function printVulnerabilityFinding(vulnerabilityInfo: VulnerabilityInfo): void {
  prettyPrintKeyValue('🔍 Title', `${vulnerabilityInfo.title}`, 25);
  prettyPrintKeyValue(
    '🛡  Severity',
    ` ${vulnerabilityInfo.severity} (${vulnerabilityInfo.score.toString()})`,
    25,
  );
  prettyPrintKeyValue('ℹ️ Type', vulnerabilityInfo.type, 25);
  prettyPrintKeyValue('🔨 Fix available?', vulnerabilityInfo.fixAvailable, 25);
  prettyPrintKeyValue(
    '🐞 Exploit available?',
    vulnerabilityInfo.fixAvailable,
    25,
  );
  prettyPrintKeyValue('📦 Package', vulnerabilityInfo.package, 25);
  prettyPrintKeyValue(
    '👨‍💼 Package manager',
    `   ${vulnerabilityInfo.packageManager}`,
    25,
  );
  prettyPrintKeyValue('📁 Filepath', vulnerabilityInfo.filePath, 25);
  prettyPrintKeyValue(
    '🧾 Version -> Fix',
    `${vulnerabilityInfo.version} -> ${vulnerabilityInfo.fixedInVersion}`,
    25,
  );

  console.log(
    '________________________________________________________________________________',
  );
}

export default new Command('vulnerabilities')
  .alias('cve')
  .description('List vulnerabilities (CVEs) for the given service. Only ECR image vulnerabilities are supported currently. Requires AWS CLI access.')
  .argument('<service>')
  .option(
    '-j, --json',
    'print vulnerabilities as stringified json to allow jq piping',
  )
  .action(withErrorHandler(vulnerabilities));
