import { React, ReactNative, Styles, Forms } from "aliucord/metro"
import { getAssetId } from "aliucord/utils"
import RichPresence from "..";
import { getSettings } from "./patches";

const { ScrollView } = ReactNative;

const { FormRow, FormSection, FormSwitch, FormInput, FormDivider } = Forms;
const Toasts = (window as any).aliucord.metro.Toasts;

// TODO: option for lfm
export default function RichPresenceSettings({ navigation }) {
    const settings = getSettings();
    const checkIcon = getAssetId("checked");

    return (<>
    {/*
        // @ts-ignore */}
        <ScrollView>
            <FormSection title="Rich Presence Settings" android_noDivider={true}>
                <FormRow
                    label="Enable Rich Presence"
                    subLabel="Rich presence will be updated when this toggle is turned on or after your Discord client is restarted."
                    trailing={<FormSwitch 
                        value = {settings.get("rpc_enabled", false)}
                        onValueChange={v => {
                            if (v && settings.get("rpc_mode", "none") == "none") {
                                Toasts.open({ content: "Please select a mode before enabling rich presence.", source: getAssetId("Small")})
                                return;
                            }

                            if (v && settings.get("rpc_mode", "lastfm") === "lastfm" && settings.get("lastfm_username", "") === "") {
                                Toasts.open({ content: "Please insert a Last.fm username or switch mode.", source: getAssetId("Small")})
                                return;
                            }

                            settings.set("rpc_enabled", v);
                            RichPresence.classInstance.init();
                            Toasts.open({ content: "Rich Presence is now " + (v ? "enabled" : "disabled") + "."})
                        }}
                    />}
                />
                { settings.get("rpc_enabled", false) &&
                    <FormRow
                        label="Force update Rich Presence"
                        subLabel="Use this to apply changes to your rich presence settings."
                        trailing={FormRow.Arrow}
                        onPress={() => {
                            RichPresence.classInstance.init();
                            Toasts.open({ content: "Rich presence updated."})
                        }}
                    />
                }
            </FormSection>
            <FormSection title="Mode">
                <FormRow
                    label="Last.fm"
                    subLabel="Show what you're listening to through Last.fm."
                    trailing={settings.get("rpc_mode", "none") === "lastfm" ? 
                        <FormRow.Icon source={checkIcon} /> : undefined
                    }
                    onPress={() => settings.set("rpc_mode", "lastfm")}
                />
                <FormRow
                    label="Custom set"
                    subLabel="Set the rich presence according to your own settings."
                    trailing={settings.get("rpc_mode", "none") === "custom" ? 
                        <FormRow.Icon source={checkIcon} /> : undefined
                    }
                    onPress={() => settings.set("rpc_mode", "custom")}
                />
            </FormSection>
            <FormSection title="Configurations">
                <FormInput
                    title="Discord Application ID [optional]"
                    value={settings.get("rpc_AppID", "")}
                    placeholder="463151177836658699"
                    onChange={v => {
                        settings.set("rpc_AppID", v);
                    }}
                />
                <FormRow
                    label="Configure Custom Rich Presence"
                    subLabel="Show how cool you are to your friends by manually customizing your rich presence."
                    trailing={FormRow.Arrow}
                    onPress={() => navigation.push("RichPresenceSetupPage")}
                />
                <FormDivider />
                <FormRow
                    label="Configure Last.fm settings"
                    subLabel="Show what you're listening to through Last.fm."
                    trailing={FormRow.Arrow}
                    onPress={() => navigation.push("LastFMConfigurePage")}
                />
            </FormSection>
        </ScrollView>
    </>)
}