import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'SchedulerAgentWebPartStrings';
import SchedulerAgent from '../../components/SchedulerAgent/SchedulerAgent';
import { ISchedulerAgentProps } from '../../components/SchedulerAgent/ISchedulerAgentProps';
import { ScheduleProvider } from '../../components/SchedulerAgent/ScheduleContext'; // <-- ADD THIS LINE
import { initSP } from '../../pnpjsConfig';
import graphService from '../../services/sp/graphService';
import { spfi } from '@pnp/sp';
import { SPFx } from '@pnp/sp/presets/all';

export interface ISchedulerAgentWebPartProps {
  description: string;
  userImageUrl?: string;
  aiAvatarOption?: 'avatar1' | 'avatar2' | 'avatar3' | 'none';
  useAiAvatar?: boolean;
  userId?: number;
}

export default class SchedulerAgentWebPart extends BaseClientSideWebPart<ISchedulerAgentWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public async onInit(): Promise<void> {
    await super.onInit();
    initSP(this.context);
    await graphService.init(this.context);

    if (!this.properties.userImageUrl) {
      const photoUrl = await graphService.getUserPhoto();
      this.properties.userImageUrl = photoUrl;
    }

    const sp = spfi().using(SPFx(this.context));
    const currentUser = await sp.web.currentUser();
    this.properties.userId = currentUser.Id;
    console.log('Current User ID:', this.properties.userId);
    console.log('Current User Email:', this.context.pageContext.user.email);    
    this._environmentMessage = await this._getEnvironmentMessage();
  }

  public render(): void {
    const schedulerAgentElement: React.ReactElement<ISchedulerAgentProps> = React.createElement(
      SchedulerAgent,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userEmail: this.context.pageContext.user.email,
        userImageUrl: this.properties.userImageUrl ?? '',
        aiAvatarOption: this.properties.aiAvatarOption ?? 'avatar1',
        useAiAvatar: this.properties.useAiAvatar ?? true,
        userId: this.properties.userId,
        showScheduleFormModal: () => {
          const modalEvent = new CustomEvent('openScheduleFormModal');
          window.dispatchEvent(modalEvent);
        }
      }
    );

    const wrappedElement = React.createElement(
      ScheduleProvider,
      { children: schedulerAgentElement }
    );
    

    ReactDom.render(wrappedElement, this.domElement);
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) {
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext().then(context => {
        switch (context.app.host.name) {
          case 'Office':
            return this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
          case 'Outlook':
            return this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
          case 'Teams':
          case 'TeamsModern':
            return this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
          default:
            return strings.UnknownEnvironment;
        }
      });
    }

    return Promise.resolve(
      this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment
    );
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) return;

    this._isDarkTheme = !!currentTheme.isInverted;

    const { semanticColors } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: strings.PropertyPaneDescription },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('userImageUrl', {
                  label: 'User Avatar Image URL'
                }),
                PropertyPaneDropdown('aiAvatarOption', {
                  label: 'AI Avatar Style',
                  options: [
                    { key: 'avatar1', text: 'Avatar 1' },
                    { key: 'avatar2', text: 'Avatar 2' },
                    { key: 'avatar3', text: 'Avatar 3' },
                    { key: 'none', text: 'None' }
                  ]
                }),
                PropertyPaneToggle('useAiAvatar', {
                  label: 'Use AI Avatar',
                  onText: 'Enabled',
                  offText: 'Disabled'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
