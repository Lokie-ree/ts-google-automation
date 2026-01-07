#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { authenticateGoogle } from './auth/google-auth.js';
import { generateFrameworkDoc, generateWelcomeKit, generateMarketingCopy } from './generators/google-doc-generator.js';
import { generateForm } from './generators/google-form-generator.js';
import { LinkManager } from './generators/link-manager.js';
import { PELICAN_CONTENT_PATHS } from './types/index.js';

const program = new Command();
const linkManager = new LinkManager();

program
  .name('pelican-beta')
  .description('Pelican AI Beta Content Automation')
  .version('1.0.0');

// Authentication command
program
  .command('auth')
  .description('Authenticate with Google Workspace API')
  .action(async () => {
    const spinner = ora('Authenticating with Google...').start();
    try {
      await authenticateGoogle();
      spinner.succeed(chalk.green('✓ Successfully authenticated!'));
      console.log(chalk.blue('\nYou can now run: npm run generate:all'));
    } catch (error) {
      spinner.fail(chalk.red('✗ Authentication failed'));
      console.error(chalk.red('\nError:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Generate all content
program
  .command('generate:all')
  .description('Generate all Google Docs and Forms for beta program')
  .action(async () => {
    console.log(chalk.blue.bold('\n🚀 Generating Pelican AI Beta Content\n'));

    try {
      // Step 1: Generate forms (no dependencies)
      const formSpinner = ora('Creating Post-Framework Survey...').start();

      const postFrameworkSurveyUrl = await generateForm({
        templatePath: PELICAN_CONTENT_PATHS.postFrameworkSurvey,
        type: 'post-framework-survey',
      });
      formSpinner.succeed('Post-Framework Survey created ✓');

      const weeklySpinner = ora('Creating Weekly Check-In Survey...').start();
      const weeklyCheckinUrl = await generateForm({
        templatePath: PELICAN_CONTENT_PATHS.weeklyCheckin,
        type: 'weekly-checkin',
      });
      weeklySpinner.succeed('Weekly Check-In Survey created ✓');

      // Step 2: Generate framework doc (needs survey link)
      const docSpinner = ora('Creating Framework Document...').start();
      const frameworkUrl = await generateFrameworkDoc({
        templatePath: PELICAN_CONTENT_PATHS.framework001,
        surveyUrl: postFrameworkSurveyUrl,
      });
      docSpinner.succeed('AIB-001 Framework Document created ✓');

      // Step 3: Generate welcome kit (needs all links)
      const welcomeSpinner = ora('Creating Welcome Kit...').start();
      const welcomeKitUrl = await generateWelcomeKit({
        templatePath: PELICAN_CONTENT_PATHS.welcomeKit,
        frameworkUrl,
        postFrameworkSurveyUrl,
        weeklyCheckinUrl,
      });
      welcomeSpinner.succeed('Welcome Kit created ✓');

      // Step 4: Save all URLs
      await linkManager.save({
        frameworkUrl,
        postFrameworkSurveyUrl,
        weeklyCheckinUrl,
        welcomeKitUrl,
        generatedAt: new Date().toISOString(),
      });

      // Display results
      console.log(chalk.green.bold('\n✅ All content generated successfully!\n'));
      console.log(chalk.blue('📋 Generated URLs:'));
      console.log(`  ${chalk.cyan('Framework:')} ${frameworkUrl}`);
      console.log(`  ${chalk.cyan('Welcome Kit:')} ${welcomeKitUrl}`);
      console.log(`  ${chalk.cyan('Post-Framework Survey:')} ${postFrameworkSurveyUrl}`);
      console.log(`  ${chalk.cyan('Weekly Check-In:')} ${weeklyCheckinUrl}`);
      console.log(chalk.blue('\n📁 Links saved to:'), 'output/generated-links.json');
      console.log(chalk.yellow('\n⚠️  Next step: Run'), chalk.bold('npm run links:export'), chalk.yellow('to get Convex constants'));

    } catch (error) {
      console.error(chalk.red('\n✗ Generation failed:'), error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// Generate single form
program
  .command('generate:form')
  .description('Generate a single Google Form')
  .argument('<type>', 'Form type (post-framework, weekly-checkin, or user-feedback)')
  .action(async (type: string) => {
    const spinner = ora(`Creating ${type} form...`).start();
    try {
      let templatePath: string;
      let formType: 'post-framework-survey' | 'weekly-checkin' | 'user-feedback-survey';

      if (type === 'post-framework' || type === 'post-framework-survey') {
        templatePath = PELICAN_CONTENT_PATHS.postFrameworkSurvey;
        formType = 'post-framework-survey';
      } else if (type === 'weekly-checkin' || type === 'weekly') {
        templatePath = PELICAN_CONTENT_PATHS.weeklyCheckin;
        formType = 'weekly-checkin';
      } else if (type === 'user-feedback' || type === 'user-feedback-survey') {
        templatePath = PELICAN_CONTENT_PATHS.userFeedbackSurvey;
        formType = 'user-feedback-survey';
      } else {
        spinner.fail(chalk.red('Invalid form type'));
        console.log(chalk.yellow('Valid types: post-framework, weekly-checkin, user-feedback'));
        process.exit(1);
        return;
      }

      const url = await generateForm({ templatePath, type: formType });
      spinner.succeed('Form created ✓');
      console.log(chalk.blue('\n📋 Form URL:'), chalk.cyan(url));
    } catch (error) {
      spinner.fail(chalk.red('Form generation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Generate single doc
program
  .command('generate:doc')
  .description('Generate a single Google Doc')
  .argument('<type>', 'Doc type (framework or welcome-kit)')
  .action(async (type: string) => {
    const spinner = ora(`Creating ${type} document...`).start();
    try {
      let url: string;

      if (type === 'framework' || type === 'framework001') {
        url = await generateFrameworkDoc({
          templatePath: PELICAN_CONTENT_PATHS.framework001,
        });
      } else if (type === 'welcome-kit' || type === 'welcome') {
        url = await generateWelcomeKit({
          templatePath: PELICAN_CONTENT_PATHS.welcomeKit,
        });
      } else {
        spinner.fail(chalk.red('Invalid doc type'));
        console.log(chalk.yellow('Valid types: framework, welcome-kit'));
        process.exit(1);
        return;
      }

      spinner.succeed('Document created ✓');
      console.log(chalk.blue('\n📄 Document URL:'), chalk.cyan(url));
    } catch (error) {
      spinner.fail(chalk.red('Document generation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Generate marketing copy
program
  .command('generate:marketing')
  .description('Generate marketing copy (emails, social posts)')
  .action(async () => {
    const spinner = ora('Creating Marketing Copy document...').start();
    try {
      const url = await generateMarketingCopy({
        templatePath: PELICAN_CONTENT_PATHS.marketingCopy,
      });

      spinner.succeed('Marketing Copy created ✓');
      console.log(chalk.blue('\n📄 Document URL:'), chalk.cyan(url));
    } catch (error) {
      spinner.fail(chalk.red('Marketing copy generation failed'));
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Export links for Convex
program
  .command('links:export')
  .description('Export generated links in format for Convex email templates')
  .action(async () => {
    try {
      if (!(await linkManager.exists())) {
        console.log(chalk.yellow('⚠️  No generated links found.'));
        console.log(chalk.blue('Run'), chalk.bold('npm run generate:all'), chalk.blue('first.'));
        process.exit(1);
      }

      const links = await linkManager.load();
      console.log(chalk.blue.bold('\n📋 Convex Email Template Constants\n'));
      console.log(chalk.green(linkManager.formatForConvex(links)));
      console.log(chalk.blue('\n💡 Copy these constants into your'), chalk.cyan('convex/email.ts'), chalk.blue('file.'));
    } catch (error) {
      console.error(chalk.red('Failed to load links:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse arguments
program.parse();

