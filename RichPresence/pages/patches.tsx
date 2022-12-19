import { React, Forms, getByProps } from "aliucord/metro";
import { findInReactTree, getAssetId } from "aliucord/utils";
import { RPLogger } from "../utils/Logger";
import RichPresenceSettings from "./RichPresenceSettings";

export const patchUI = (plugin) => {
    const { getByName } = (window as any).aliucord.metro;

    const Locale = getByProps("Messages");
    const Scenes = getByName("getScreens", { default: false });
    const { FormSection, FormRow, FormDivider } = Forms;

    const UserSettingsOverviewWrapper = getByName("UserSettingsOverviewWrapper", { default: false });

    plugin.patcher.after(Scenes, "default", (_, res: any) => {
        return {
            ...res,
            RichPresenceSettings: {
                key: "RichPresenceSettings",
                title: "Rich Presence",
                render: RichPresenceSettings
            }
        }
    });

    const unpatch = plugin.patcher.after(UserSettingsOverviewWrapper, "default", (_, res) => {
        const Overview = findInReactTree(res, m => m.type?.name === "UserSettingsOverview");

        plugin.patcher.after(Overview.type.prototype, "render", (res, { props }) => {
            const { children } = props;
            const { navigation } = res.thisObject.props;

            children.splice(4, 0, <>
                <FormRow 
                    leading={<FormRow.Icon source={getAssetId("Discord")}/>}
                    label="Rich Presence"
                    trailing={FormRow.Arrow}
                    onPress={() => navigation.push("RichPresenceSettings", { navigation })}
                />
            </>)
        });

        unpatch();
    });
}