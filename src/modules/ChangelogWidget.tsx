import {DOM} from "../tools/DOM";
import {getExtUrlFromPage, strIsNullOrEmpty} from "../tools/MiscUtils";
import {Config} from "../tools/Config";
import MediaWidget from "../MediaWidget";

declare namespace build {
    export const R20ES_CHANGELOG: string;
}

interface IChangelog {
    current: string;
    versions: IVersion[];
}

interface IChange {
    id: string;
    content: string;
}

interface IChangelogInfo {
    title: string;
    media: string;
}

interface IVersion {
    info: IChangelogInfo;
    changes: IChange[];
}

interface PreparedVersion {
    data: IVersion;
    semverString: string;
    mediaUrl: string | null;
}

class ChangelogWidget extends DOM.ElementBase {
    private preparedData: PreparedVersion[] = [];
    private isLoading: boolean = true;

    public constructor({listAllVersions}: any) {
        super();

        const changelogData: IChangelog = JSON.parse(build.R20ES_CHANGELOG)
        console.log(changelogData);

        const promises = [];

        if (listAllVersions) {
            console.log("in list all");
            console.log(changelogData.versions);
            for (const versionName in changelogData.versions) {
                promises.push(this.prepareChanges(changelogData.versions[versionName], versionName));
            }

        } else {
            console.log("in else");
            const current = changelogData.versions[changelogData.current];
            promises.push(this.prepareChanges(current, changelogData.current));
        }

        console.log(promises);
        (Promise.all(promises) as any).finally(() => {
            this.isLoading = false;
            this.rerender();
        })
    }

    private prepareChanges(version: IVersion, semverString: string) {
        console.log(`prep ${version.info.title}`);
        const pushData = (url: string | null) => {
            this.preparedData.push({
                data: version,
                mediaUrl: url,
                semverString: semverString
            })
        };

        if (!strIsNullOrEmpty(version.info.media)) {
            return getExtUrlFromPage(version.info.media, 5000)
                .then(pushData)
                .catch(err => console.error(`Failed to get media ${version.info.media}: ${err}`));
        }

        pushData(null);
        return Promise.resolve();
    }

    private onClickLine = (e) => {
        e.stopPropagation();
        const url = e.target.getAttribute("data-url");
        if (!url) return;
        window.open(url, "_blank");
    };

    protected internalRender(): HTMLElement {

        if (this.preparedData.length <= 0) {
            return (
                <div>
                    {this.isLoading ? "Loading..." : "We have no changes to display :/... What?"}
                </div>
            )
        }

        const buildVersionHtml = (version: PreparedVersion): HTMLElement => {
            const list = [];

            for (const change of version.data.changes) {
                list.push(strIsNullOrEmpty(change.id)
                    ? <li>{change.content}</li>
                    : <li><a data-url={Config.websiteFeatureUrlTemplate + change.id} href="javascript:void(0)"
                             onClick={this.onClickLine}>{change.content}</a></li>);
            }

            const headerWidget = version.data.info.title
                ? <div>
                    <h2>{version.data.info.title}</h2>
                    <h3>{version.semverString}</h3>
                </div>
                : <div>
                    <h2>{version.semverString}</h2>
                </div>;

            return (
                <ul>
                    {headerWidget}

                    {!strIsNullOrEmpty(version.mediaUrl) &&
                    <MediaWidget url={version.mediaUrl} description=""/>
                    }

                    {list}
                    <hr/>
                </ul>
            );
        };

        return <div>
            {this.preparedData.map(buildVersionHtml)}
        </div>
    }

}

export default ChangelogWidget;