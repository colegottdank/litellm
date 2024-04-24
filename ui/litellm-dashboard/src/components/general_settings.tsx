import React, { useState, useEffect } from "react";
import {
  Card,
  Title,
  Subtitle,
  Table,
  TableHead,
  TableRow,
  Badge,
  TableHeaderCell,
  TableCell,
  TableBody,
  Metric,
  Text,
  Grid,
  Button,
  TextInput,
  Col,
} from "@tremor/react";
import { TabPanel, TabPanels, TabGroup, TabList, Tab, Icon } from "@tremor/react";
import { getCallbacksCall, setCallbacksCall, serviceHealthCheck } from "./networking";
import { Modal, Form, Input, Select, Button as Button2, message } from "antd";
import StaticGenerationSearchParamsBailoutProvider from "next/dist/client/components/static-generation-searchparams-bailout-provider";
import AddFallbacks from "./add_fallbacks"

interface GeneralSettingsPageProps {
  accessToken: string | null;
  userRole: string | null;
  userID: string | null;
  modelData: any
}

const GeneralSettings: React.FC<GeneralSettingsPageProps> = ({
  accessToken,
  userRole,
  userID,
  modelData
}) => {
  const [routerSettings, setRouterSettings] = useState<{ [key: string]: any }>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCallback, setSelectedCallback] = useState<string | null>(null);

  let paramExplanation: { [key: string]: string } = {
    "routing_strategy_args": "(dict) Arguments to pass to the routing strategy",
    "routing_strategy": "(string) Routing strategy to use",
    "allowed_fails": "(int) Number of times a deployment can fail before being added to cooldown",
    "cooldown_time": "(int) time in seconds to cooldown a deployment after failure",
    "num_retries": "(int) Number of retries for failed requests. Defaults to 0.",
    "timeout": "(float) Timeout for requests. Defaults to None.",
    "retry_after": "(int) Minimum time to wait before retrying a failed request",
  }

  useEffect(() => {
    if (!accessToken || !userRole || !userID) {
      return;
    }
    getCallbacksCall(accessToken, userID, userRole).then((data) => {
      console.log("callbacks", data);
      let router_settings = data.router_settings;
      setRouterSettings(router_settings);
    });
  }, [accessToken, userRole, userID]);

  const handleAddCallback = () => {
    console.log("Add callback clicked");
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedCallback(null);
  };

  const handleSaveChanges = (router_settings: any) => {
    if (!accessToken) {
      return;
    }

    console.log("router_settings", router_settings);

    const updatedVariables = Object.fromEntries(
      Object.entries(router_settings).map(([key, value]) => [key, (document.querySelector(`input[name="${key}"]`) as HTMLInputElement)?.value || value])
    );

    console.log("updatedVariables", updatedVariables);

    const payload = {
      router_settings: updatedVariables
    };

    try {
      setCallbacksCall(accessToken, payload);
    } catch (error) {
      message.error("Failed to update router settings: " + error, 20);
    }

    message.success("router settings updated successfully");
  };

  

  if (!accessToken) {
    return null;
  }

  return (
    <div className="w-full mx-4">
      <TabGroup className="gap-2 p-8 h-[75vh] w-full mt-2">
        <TabList variant="line" defaultValue="1">
          <Tab value="1">General Settings</Tab>
          <Tab value="2">Fallbacks</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
      <Grid numItems={1} className="gap-2 p-8 w-full mt-2">
      <Title>Router Settings</Title>
        <Card >
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Setting</TableHeaderCell>
                <TableHeaderCell>Value</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(routerSettings).map(([param, value]) => (
                <TableRow key={param}>
                  <TableCell>
                    <Text>{param}</Text>
                    <p style={{fontSize: '0.65rem', color: '#808080', fontStyle: 'italic'}} className="mt-1">{paramExplanation[param]}</p>
                  </TableCell>
                  <TableCell>
                    <TextInput
                      name={param}
                      defaultValue={
                        typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
        </Card>
        <Col>
            <Button className="mt-2" onClick={() => handleSaveChanges(routerSettings)}>
            Save Changes
            </Button>
        </Col>
      </Grid>
      </TabPanel>
      <TabPanel>
      <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Model Name</TableHeaderCell>
          <TableHeaderCell>Fallbacks</TableHeaderCell>
        </TableRow>
      </TableHead>

        <TableBody>
          {
            routerSettings["fallbacks"] &&
            routerSettings["fallbacks"].map((item: Object, index: number) =>
              Object.entries(item).map(([key, value]) => (
                <TableRow key={index.toString() + key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>{Array.isArray(value) ? value.join(', ') : value}</TableCell>
                </TableRow>
              ))
            )
          }
        </TableBody>
      </Table>
      <AddFallbacks models={modelData?.data ? modelData.data.map((data: any) => data.model_name) : []} accessToken={accessToken} routerSettings={routerSettings} setRouterSettings={setRouterSettings}/>
      </TabPanel>
      </TabPanels>
    </TabGroup>
    </div>
  );
};

export default GeneralSettings;